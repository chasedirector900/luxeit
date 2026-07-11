"""Emergency IP blocklist — the "block that abusive IP right now" lever.

Set DJANGO_BLOCKED_IPS (comma-separated) in the environment and restart; no
code change or deploy needed. Requests from those IPs are rejected before any
view, session, or database work happens.
"""
from django.conf import settings
from django.http import HttpResponseForbidden

from .net import client_ip


class BlockedIPMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        blocked = getattr(settings, "BLOCKED_IPS", ())
        if blocked and client_ip(request) in blocked:
            return HttpResponseForbidden("Forbidden.")
        return self.get_response(request)
