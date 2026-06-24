"""Rate limits for the passwordless OTP endpoints.

These stop abuse of the code flow: brute-forcing codes, hammering the API, and
"bombing" a victim's inbox/phone with repeated code requests. Backed by the
Django cache (use a shared cache like Redis in production so limits hold across
worker processes).
"""
from rest_framework.throttling import SimpleRateThrottle

from .services import detect_channel, normalize_destination


class OTPRequestThrottle(SimpleRateThrottle):
    """Caps code requests per client IP (scope rate in settings: otp_request)."""

    scope = "otp_request"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class OTPVerifyThrottle(SimpleRateThrottle):
    """Caps verify attempts per client IP (scope rate: otp_verify)."""

    scope = "otp_verify"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class OTPDestinationThrottle(SimpleRateThrottle):
    """Caps how many codes a single email/phone can receive (scope: otp_destination).

    Keyed on the destination rather than the IP, so an attacker can't bomb one
    victim from many IPs.
    """

    scope = "otp_destination"

    def get_cache_key(self, request, view):
        identifier = (request.data.get("identifier") or "").strip()
        channel = detect_channel(identifier)
        if not channel:
            return None  # invalid input — let the view return the validation error
        destination = normalize_destination(channel, identifier)
        return self.cache_format % {"scope": self.scope, "ident": destination}
