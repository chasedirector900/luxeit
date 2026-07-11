"""Channel detection and one-time-code delivery.

Delivery is stubbed for development: the code is printed to the runserver
console. Swap the ``_send_*`` helpers for a real email backend / SMS gateway in
production (set OTP_DELIVERY_CONSOLE=False once those are wired up).
"""
import logging
import re

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

from .models import LoginCode

logger = logging.getLogger(__name__)


def otp_budget_exceeded() -> bool:
    """Global circuit breaker on code sending (OTP_GLOBAL_HOURLY_CAP).

    Counts every send attempt in the current clock hour; past the cap, code
    issuing stops system-wide and a critical log line fires — so a 3am flood
    can never run up the email/SMS bill unbounded."""
    cap = getattr(settings, "OTP_GLOBAL_HOURLY_CAP", 0)
    if cap <= 0:
        return False
    key = f"otp-send-budget:{timezone.now():%Y%m%d%H}"
    try:
        count = cache.incr(key)
    except ValueError:  # first send this hour
        cache.add(key, 1, 3900)
        count = 1
    if count > cap:
        logger.critical(
            "OTP circuit breaker OPEN: %s send attempts this hour (cap %s). "
            "Codes are NOT being sent. Investigate for abuse.", count, cap,
        )
        return True
    return False

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# E.164-ish: optional +, then 7–15 digits. Spaces/dashes are stripped first.
_PHONE_RE = re.compile(r"^\+?\d{7,15}$")


def detect_channel(identifier: str) -> str | None:
    """Return 'email' or 'phone' for an identifier, or None if it's neither."""
    value = identifier.strip()
    if _EMAIL_RE.match(value):
        return LoginCode.CHANNEL_EMAIL
    if _PHONE_RE.match(value.replace(" ", "").replace("-", "")):
        return LoginCode.CHANNEL_PHONE
    return None


def normalize_destination(channel: str, identifier: str) -> str:
    value = identifier.strip()
    if channel == LoginCode.CHANNEL_EMAIL:
        return value.lower()
    return value.replace(" ", "").replace("-", "")


def deliver_code(channel: str, destination: str, code: str) -> None:
    # Dev: print to the terminal instead of actually sending. Real email/SMS
    # delivery is wired below for when OTP_DELIVERY_CONSOLE is turned off.
    if getattr(settings, "OTP_DELIVERY_CONSOLE", True):
        _print_to_console(channel, destination, code)
        return
    if channel == LoginCode.CHANNEL_EMAIL:
        _send_email(destination, code)
    else:
        _send_sms(destination, code)


def _print_to_console(channel: str, destination: str, code: str) -> None:
    label = "EMAIL" if channel == LoginCode.CHANNEL_EMAIL else "SMS"
    line = f"  luxeit {label} login code -> {destination}: {code}  (valid {LoginCode.TTL_MINUTES} min)"
    bar = "=" * (len(line) + 2)
    # print (not logging) so it always shows in the runserver terminal.
    print(f"\n{bar}\n{line}\n{bar}\n", flush=True)


def _send_email(destination: str, code: str) -> None:
    # TODO(prod): send via Django email backend / transactional email provider.
    from django.core.mail import send_mail

    send_mail(
        subject="Your luxeit login code",
        message=f"Your luxeit login code is {code}. It expires in {LoginCode.TTL_MINUTES} minutes.",
        from_email=None,
        recipient_list=[destination],
    )


def _send_sms(destination: str, code: str) -> None:
    # TODO(prod): integrate an SMS gateway (e.g. Twilio / Africa's Talking).
    raise NotImplementedError("SMS delivery is not configured.")


def describe_device(user_agent: str) -> str:
    """A friendly label for a device from its User-Agent, e.g. 'Chrome on Windows'."""
    ua = (user_agent or "").lower()
    if "iphone" in ua or "ipad" in ua:
        os_name = "iOS"
    elif "android" in ua:
        os_name = "Android"
    elif "windows" in ua:
        os_name = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "linux" in ua:
        os_name = "Linux"
    else:
        os_name = "Unknown OS"

    if "edg/" in ua:
        browser = "Edge"
    elif "opr/" in ua or " opera" in ua:
        browser = "Opera"
    elif "chrome" in ua and "chromium" not in ua:
        browser = "Chrome"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "safari" in ua:
        browser = "Safari"
    else:
        browser = "Browser"
    return f"{browser} on {os_name}"


def notify_new_device(user, device_label: str) -> None:
    """Alert the account owner that a new device signed in."""
    destination = getattr(user, "email", None) or getattr(user, "phone", None)
    if not destination:
        return
    text = (
        f"New sign-in to your luxeit account on {device_label}. "
        "If this wasn't you, open Account > Security and log out all devices."
    )
    if getattr(settings, "OTP_DELIVERY_CONSOLE", True):
        line = f"  luxeit SECURITY ALERT -> {destination}: {text}"
        bar = "=" * (len(line) + 2)
        print(f"\n{bar}\n{line}\n{bar}\n", flush=True)
        return
    if "@" in str(destination):
        from django.core.mail import send_mail

        send_mail("New sign-in to luxeit", text, None, [destination])
    # else: SMS gateway TODO(prod)
