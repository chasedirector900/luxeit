"""Passwordless admin sign-in: email OTP or Google, for staff only.

Deliberately separate from the customer-facing OTP/Google endpoints in
users/views.py (which are DRF JSON APIs for the SPA, and get_or_create a
new account for any email). This is plain-Django, HTML-form based (it
renders inside the admin's own login page), and — critically — never
creates an account: it only ever logs in an *existing* user who already
has is_staff=True. A customer proving they own an email address must
never be enough to reach the admin.

The classic username+password form still works untouched (see
registration/login.html) as the superuser's fallback in case email
delivery or Google's OAuth ever has an outage.
"""
import logging

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth import get_user_model
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from .models import LoginCode
from .services import deliver_code, detect_channel, normalize_destination, otp_budget_exceeded

_AUTH_BACKEND = "django.contrib.auth.backends.ModelBackend"
# Same message regardless of whether the email matches a staff account, so
# this page can't be used to enumerate which addresses have admin access.
_GENERIC_SENT_MESSAGE = "If that email belongs to an admin account, a code has been sent."


def _staff_user_or_none(email):
    User = get_user_model()
    user = User.objects.filter(email__iexact=email, is_staff=True, is_active=True).first()
    return user


def _safe_next(request) -> str:
    next_url = request.POST.get("next") or request.GET.get("next") or ""
    return next_url if next_url.startswith("/") else reverse("admin:index")


@require_POST
def staff_otp_request(request):
    email = (request.POST.get("email") or "").strip()
    next_url = _safe_next(request)
    login_url = f"{reverse('admin:login')}?next={next_url}" if next_url != reverse("admin:index") else reverse("admin:login")

    channel = detect_channel(email)
    if channel != LoginCode.CHANNEL_EMAIL:
        messages.error(request, "Enter a valid email address.")
        return redirect(login_url)

    if otp_budget_exceeded():
        messages.error(request, "We can't send codes right now. Please try again shortly.")
        return redirect(login_url)

    destination = normalize_destination(channel, email)
    user = _staff_user_or_none(destination)
    if user is not None:
        _, code = LoginCode.issue(channel, destination)
        deliver_code(channel, destination, code)

    messages.success(request, _GENERIC_SENT_MESSAGE)
    return redirect(f"{reverse('admin:login')}?next={next_url}&otp_step=verify&otp_email={destination}")


@require_POST
def staff_otp_verify(request):
    email = (request.POST.get("email") or "").strip()
    code = (request.POST.get("code") or "").strip()
    next_url = _safe_next(request)
    login_url = reverse("admin:login")

    channel = detect_channel(email)
    if channel != LoginCode.CHANNEL_EMAIL or not code:
        messages.error(request, "Enter the code that was emailed to you.")
        return redirect(f"{login_url}?next={next_url}&otp_step=verify&otp_email={email}")

    destination = normalize_destination(channel, email)
    login_code = LoginCode.objects.filter(destination=destination).order_by("-created_at").first()
    user = _staff_user_or_none(destination)

    # Check the code regardless of whether `user` exists, so the timing and
    # response look the same either way — still no account enumeration.
    verified = login_code is not None and login_code.verify(code)
    if not verified or user is None:
        messages.error(request, "That code didn't work — it may be wrong, expired, or already used.")
        return redirect(f"{login_url}?next={next_url}&otp_step=verify&otp_email={email}")

    login(request, user, backend=_AUTH_BACKEND)
    return redirect(next_url)


@require_POST
def staff_google_login(request):
    next_url = _safe_next(request)
    login_url = reverse("admin:login")
    credential = (request.POST.get("credential") or "").strip()
    if not credential:
        messages.error(request, "Missing Google credential.")
        return redirect(login_url)

    client_id = str(getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "")).strip()
    if not client_id:
        messages.error(request, "Google sign-in isn't set up.")
        return redirect(login_url)

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        claims = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id, clock_skew_in_seconds=10
        )
    except Exception as exc:  # noqa: BLE001 — log the real reason, return a safe message
        logging.getLogger("users.google").warning("Staff Google token verify failed: %s", exc)
        messages.error(request, "Couldn't verify your Google sign-in. Please try again.")
        return redirect(login_url)

    email = str(claims.get("email") or "").strip().lower()
    if not email or not claims.get("email_verified", False):
        messages.error(request, "That Google account doesn't have a verified email.")
        return redirect(login_url)

    user = _staff_user_or_none(email)
    if user is None:
        messages.error(request, "That Google account isn't registered as an admin here.")
        return redirect(login_url)

    login(request, user, backend=_AUTH_BACKEND)
    return redirect(next_url)
