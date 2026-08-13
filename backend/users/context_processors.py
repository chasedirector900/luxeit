"""Exposes the Google OAuth client id to the admin login page template
(templates/admin/login.html) — that page isn't backed by our own view, so
this is the way to hand it extra context without overriding AdminSite.login."""
from django.conf import settings


def google_client_id(request):
    if not request.path.startswith("/admin/login"):
        return {}
    return {"google_client_id": str(getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "")).strip()}
