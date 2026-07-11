"""Client-IP resolution that respects the trusted-proxy count.

Shared by the IP blocklist middleware and django-axes so every layer agrees on
who the client is. Mirrors DRF's NUM_PROXIES semantics: with N trusted proxies,
the real client is the Nth-from-last entry in X-Forwarded-For; everything
further left is client-supplied and spoofable.
"""
from django.conf import settings


def client_ip(request) -> str:
    num_proxies = settings.REST_FRAMEWORK.get("NUM_PROXIES") or 0
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if num_proxies > 0 and xff:
        addrs = [a.strip() for a in xff.split(",") if a.strip()]
        if addrs:
            return addrs[-min(num_proxies, len(addrs))]
    return request.META.get("REMOTE_ADDR", "")
