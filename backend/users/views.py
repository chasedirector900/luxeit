import logging

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import LoginCode, NotificationPreferences, User, UserSession
from .serializers import NotificationPreferencesSerializer, UserSerializer, UserSessionSerializer
from .services import (
    deliver_code,
    describe_device,
    detect_channel,
    normalize_destination,
    notify_new_device,
    otp_budget_exceeded,
)
from .throttles import OTPDestinationThrottle, OTPRequestThrottle, OTPVerifyThrottle
from messaging.services import post_system_message, post_welcome

# The auth backend to attach on login (no password means authenticate() can't be used).
_AUTH_BACKEND = "django.contrib.auth.backends.ModelBackend"


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf(request):
    """Set the CSRF cookie so the SPA can send X-CSRFToken on authenticated POSTs."""
    return Response(status=status.HTTP_204_NO_CONTENT)


PHONE_DISABLED_MESSAGE = (
    "Phone sign-in isn't available yet — SMS is still being set up. "
    "Please sign in with your email for now."
)


def _phone_login_blocked(channel) -> bool:
    """Phone/SMS login is gated off until an SMS gateway is paid for."""
    return channel == LoginCode.CHANNEL_PHONE and not getattr(settings, "PHONE_LOGIN_ENABLED", False)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([OTPRequestThrottle, OTPDestinationThrottle])
def request_code(request):
    """Send a one-time login code to an email or phone number."""
    identifier = (request.data.get("identifier") or "").strip()
    if not identifier:
        return Response(
            {"detail": "An email or phone number is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    channel = detect_channel(identifier)
    if channel is None:
        return Response(
            {"detail": "Enter a valid email address or phone number."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if _phone_login_blocked(channel):
        return Response({"detail": PHONE_DISABLED_MESSAGE}, status=status.HTTP_400_BAD_REQUEST)

    if otp_budget_exceeded():
        return Response(
            {"detail": "We can't send codes right now. Please try again in a little while."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    destination = normalize_destination(channel, identifier)
    _, code = LoginCode.issue(channel, destination)
    deliver_code(channel, destination, code)

    payload = {"channel": channel, "destination": destination}
    # Convenience for local development only — never leak codes in production.
    if getattr(settings, "OTP_DELIVERY_CONSOLE", False) and settings.DEBUG:
        payload["dev_code"] = code
    return Response(payload, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([OTPVerifyThrottle])
def verify_code(request):
    """Verify a code and start a 5-day session, creating the account on first login."""
    identifier = (request.data.get("identifier") or "").strip()
    code = (request.data.get("code") or "").strip()
    if not identifier or not code:
        return Response(
            {"detail": "Identifier and code are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    channel = detect_channel(identifier)
    if channel is None:
        return Response(
            {"detail": "Enter a valid email address or phone number."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if _phone_login_blocked(channel):
        return Response({"detail": PHONE_DISABLED_MESSAGE}, status=status.HTTP_400_BAD_REQUEST)
    destination = normalize_destination(channel, identifier)

    # Look at the latest code for this destination (issuing a new one marks older
    # ones used), then report a specific reason if verification fails.
    login_code = (
        LoginCode.objects.filter(destination=destination).order_by("-created_at").first()
    )
    if login_code is None:
        return Response(
            {"detail": "No code was requested for this contact. Tap Send code first."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not login_code.verify(code):
        if login_code.used:
            detail = "This code was already used. Request a new one."
        elif login_code.is_expired:
            detail = "This code has expired. Request a new one."
        elif login_code.attempts >= LoginCode.MAX_ATTEMPTS:
            detail = "Too many attempts. Request a new code."
        else:
            detail = "Incorrect code. Please check the digits and try again."
        return Response({"detail": detail}, status=status.HTTP_400_BAD_REQUEST)

    user, created = _get_or_create_user(channel, destination)
    if not user.is_active:
        return Response(
            {"detail": "This account is disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )

    login(request, user, backend=_AUTH_BACKEND)
    if created:
        post_welcome(user)
    _record_session(request, user)
    return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    """Sign in (or sign up) with a Google ID token from Google Identity Services.

    The browser sends the short-lived `credential` JWT that Google issues after
    the user taps "Continue with Google". We verify it against our OAuth client
    ID, trust the (Google-verified) email, and log the user in with the same
    session flow as the email OTP path — so Google users are ordinary accounts.
    """
    credential = str(request.data.get("credential") or "").strip()
    if not credential:
        return Response({"detail": "Missing Google credential."}, status=status.HTTP_400_BAD_REQUEST)

    # Strip stray whitespace/newlines that can sneak in when the ID is pasted
    # into a dashboard env var — a trailing space makes the audience check fail.
    client_id = str(getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "")).strip()
    if not client_id:
        return Response(
            {"detail": "Google sign-in isn't set up yet. Please continue with your email."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        # Verifies the signature, audience (our client_id), issuer, and expiry.
        # A little clock skew tolerance guards against minor server time drift.
        claims = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id, clock_skew_in_seconds=10
        )
    except Exception as exc:  # noqa: BLE001 — log the real reason, return a safe message
        logging.getLogger("users.google").warning("Google token verify failed: %s", exc)
        # TEMP(debug): surface the real reason to the client to diagnose the live
        # sign-in failure. Revert to the generic message once fixed.
        return Response(
            {"detail": f"Google verify failed: {type(exc).__name__}: {exc}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = str(claims.get("email") or "").strip().lower()
    if not email or not claims.get("email_verified", False):
        return Response(
            {"detail": "Your Google account doesn't have a verified email."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user, created = _get_or_create_user(LoginCode.CHANNEL_EMAIL, email)

    # Seed the display name from Google on first sign-up only — never overwrite a
    # name the user has already set themselves.
    name = str(claims.get("name") or "").strip()
    if name and not user.full_name:
        user.full_name = name[:150]
        user.save(update_fields=["full_name"])

    if not user.is_active:
        return Response({"detail": "This account is disabled."}, status=status.HTTP_403_FORBIDDEN)

    login(request, user, backend=_AUTH_BACKEND)
    if created:
        post_welcome(user)
    _record_session(request, user)
    return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    UserSession.objects.filter(session_key=request.session.session_key).delete()
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == "DELETE":
        # Permanently delete the account. Cascades to sessions/threads/messages;
        # product reviews are kept but anonymised (user set null).
        user = request.user
        logout(request)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method == "PATCH":
        # Display name + delivery address are editable here. Email/phone are login
        # identifiers and require an OTP re-verification flow to change.
        updated = []
        full_name = request.data.get("full_name")
        if full_name is not None:
            request.user.full_name = str(full_name).strip()[:150]
            updated.append("full_name")

        # Contact/delivery phone — a plain, unverified detail (not the login
        # identifier), so it saves directly here with no OTP round-trip.
        contact_phone = request.data.get("contact_phone")
        if contact_phone is not None:
            request.user.contact_phone = str(contact_phone).strip()[:30]
            updated.append("contact_phone")

        if "address" in request.data:
            # Accept a nested {line1, city, area} object; null/empty clears it.
            # Keyed on presence so omitting "address" leaves it untouched.
            address = request.data.get("address") or {}
            request.user.address_line1 = str(address.get("line1") or "").strip()[:200]
            request.user.address_city = str(address.get("city") or "").strip()[:120]
            request.user.address_area = str(address.get("area") or "").strip()[:120]
            updated += ["address_line1", "address_city", "address_area"]

        if updated:
            request.user.save(update_fields=updated)
        return Response(UserSerializer(request.user).data)

    UserSession.objects.filter(session_key=request.session.session_key).update(
        last_seen=timezone.now()
    )
    return Response(UserSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sessions_list(request):
    """List the current user's signed-in devices (and prune any that have expired)."""
    valid_keys = set(
        Session.objects.filter(expire_date__gt=timezone.now()).values_list("session_key", flat=True)
    )
    user_sessions = list(request.user.sessions.all())
    stale = [s.id for s in user_sessions if s.session_key not in valid_keys]
    if stale:
        request.user.sessions.filter(id__in=stale).delete()
        user_sessions = [s for s in user_sessions if s.id not in stale]

    current = request.session.session_key
    data = UserSessionSerializer(user_sessions, many=True, context={"current": current}).data
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def revoke_session(request, session_id):
    """Log out one specific device."""
    target = request.user.sessions.filter(id=session_id).first()
    if target is None:
        return Response({"detail": "Device not found."}, status=status.HTTP_404_NOT_FOUND)
    Session.objects.filter(session_key=target.session_key).delete()
    target.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_others(request):
    """Log out every device except the current one."""
    current = request.session.session_key
    others = request.user.sessions.exclude(session_key=current)
    Session.objects.filter(
        session_key__in=list(others.values_list("session_key", flat=True))
    ).delete()
    others.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def preferences(request):
    """Get or update the user's notification preferences."""
    prefs, _ = NotificationPreferences.objects.get_or_create(user=request.user)
    if request.method == "PATCH":
        serializer = NotificationPreferencesSerializer(prefs, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(NotificationPreferencesSerializer(prefs).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([OTPRequestThrottle, OTPDestinationThrottle])
def change_contact_request(request):
    """Send an OTP to a NEW email/phone the user wants to switch their login to."""
    identifier = (request.data.get("identifier") or "").strip()
    channel = detect_channel(identifier)
    if channel is None:
        return Response({"detail": "Enter a valid email address or phone number."}, status=status.HTTP_400_BAD_REQUEST)
    if _phone_login_blocked(channel):
        return Response({"detail": PHONE_DISABLED_MESSAGE}, status=status.HTTP_400_BAD_REQUEST)

    destination = normalize_destination(channel, identifier)
    field = "email" if channel == LoginCode.CHANNEL_EMAIL else "phone"
    if getattr(request.user, field) == destination:
        return Response({"detail": f"That's already your {field}."}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(**{field: destination}).exclude(pk=request.user.pk).exists():
        return Response({"detail": "That contact is already in use by another account."}, status=status.HTTP_400_BAD_REQUEST)

    if otp_budget_exceeded():
        return Response(
            {"detail": "We can't send codes right now. Please try again in a little while."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    _, code = LoginCode.issue(channel, destination)
    deliver_code(channel, destination, code)
    payload = {"channel": channel, "destination": destination}
    if getattr(settings, "OTP_DELIVERY_CONSOLE", False) and settings.DEBUG:
        payload["dev_code"] = code
    return Response(payload, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([OTPVerifyThrottle])
def change_contact_verify(request):
    """Verify the OTP and swap the user's login email/phone to the new value."""
    identifier = (request.data.get("identifier") or "").strip()
    code = (request.data.get("code") or "").strip()
    channel = detect_channel(identifier)
    if channel is None:
        return Response({"detail": "Enter a valid email address or phone number."}, status=status.HTTP_400_BAD_REQUEST)

    destination = normalize_destination(channel, identifier)
    login_code = LoginCode.objects.filter(destination=destination).order_by("-created_at").first()
    if login_code is None or not login_code.verify(code):
        return Response({"detail": "Invalid or expired code."}, status=status.HTTP_400_BAD_REQUEST)

    field = "email" if channel == LoginCode.CHANNEL_EMAIL else "phone"
    if User.objects.filter(**{field: destination}).exclude(pk=request.user.pk).exists():
        return Response({"detail": "That contact is already in use by another account."}, status=status.HTTP_400_BAD_REQUEST)

    setattr(request.user, field, destination)
    setattr(request.user, f"{field}_verified", True)
    request.user.save(update_fields=[field, f"{field}_verified"])
    return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_data(request):
    """Export everything we hold for the user as JSON (GDPR-style).

    Disabled for now (DATA_EXPORT_ENABLED) — data-copy requests go through
    support instead, per Privacy Policy §8."""
    if not getattr(settings, "DATA_EXPORT_ENABLED", False):
        return Response(
            {"detail": "Data export is temporarily unavailable. Contact support for a copy of your data."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    user = request.user
    threads = [
        {
            "name": t.name,
            "kind": t.kind,
            "messages": [
                {"sender": m.sender, "body": m.body, "created_at": m.created_at.isoformat()}
                for m in t.messages.all()
            ],
        }
        for t in user.threads.prefetch_related("messages")
    ]
    prefs, _ = NotificationPreferences.objects.get_or_create(user=user)
    orders = [
        {
            "reference": o.reference,
            "status": o.status,
            "total": float(o.total),
            "placed_at": o.placed_at.isoformat(),
            "items": [
                {"title": i.title, "quantity": i.quantity, "price": float(i.unit_price)}
                for i in o.items.all()
            ],
        }
        for o in user.orders.prefetch_related("items")
    ]
    data = {
        "exported_at": timezone.now().isoformat(),
        "account": UserSerializer(user).data,
        "preferences": NotificationPreferencesSerializer(prefs).data,
        "devices": [
            {
                "device": s.device_label,
                "ip": str(s.ip_address or ""),
                "last_seen": s.last_seen.isoformat(),
            }
            for s in user.sessions.all()
        ],
        "orders": orders,
        "messages": threads,
    }
    return Response(data)


def _get_or_create_user(channel: str, destination: str) -> tuple[User, bool]:
    field = "email" if channel == LoginCode.CHANNEL_EMAIL else "phone"
    verified_field = f"{field}_verified"

    user = User.objects.filter(**{field: destination}).first()
    created = user is None
    if user is None:
        user = User(**{field: destination})
        user.set_unusable_password()

    setattr(user, verified_field, True)
    user.save()
    return user, created


def _client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _record_session(request, user) -> None:
    """Save this device's session row and alert the user if it's a new device."""
    key = request.session.session_key
    if not key:
        request.session.save()
        key = request.session.session_key

    user_agent = request.META.get("HTTP_USER_AGENT", "")
    label = describe_device(user_agent)
    prior_labels = set(UserSession.objects.filter(user=user).values_list("device_label", flat=True))

    UserSession.objects.update_or_create(
        session_key=key,
        defaults={
            "user": user,
            "device_label": label,
            "user_agent": user_agent[:400],
            "ip_address": _client_ip(request),
            "last_seen": timezone.now(),
        },
    )
    # Alert only when an additional, not-seen-before device signs in.
    if prior_labels and label not in prior_labels:
        notify_new_device(user, label)  # push (email/SMS / console in dev)
        post_system_message(  # and an in-app message in their inbox
            user,
            f"New sign-in on {label}. If this wasn't you, open Account > Security and log out all devices.",
        )
