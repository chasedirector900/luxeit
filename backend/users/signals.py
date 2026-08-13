"""Record every successful login — customer OTP/Google sign-ins and staff
admin sign-ins alike — as a `UserSession` row, so the admin can see a real
sign-in history per account (device, IP, when), not just Django's single
`last_login` timestamp.

The customer-facing OTP/Google login views already call `_record_session`
directly right after `login()` (see users/views.py) to also handle the
"new device" alert; this signal additionally covers admin logins, and
harmlessly re-runs the same upsert for the customer paths (idempotent on
`session_key`, negligible cost).
"""
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.utils import timezone

from api.net import client_ip

from .models import UserSession
from .services import describe_device


@receiver(user_logged_in)
def record_login_session(sender, request, user, **kwargs):
    key = request.session.session_key
    if not key:
        request.session.save()
        key = request.session.session_key

    user_agent = request.META.get("HTTP_USER_AGENT", "")
    UserSession.objects.update_or_create(
        session_key=key,
        defaults={
            "user": user,
            "device_label": describe_device(user_agent),
            "user_agent": user_agent[:400],
            "ip_address": client_ip(request),
            "last_seen": timezone.now(),
        },
    )
