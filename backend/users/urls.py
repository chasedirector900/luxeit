from django.urls import re_path

from . import views

app_name = "users"

# Trailing slash is optional (`/?$`) so the endpoints work whether or not the
# Next.js proxy preserves it — avoids APPEND_SLASH redirecting a POST (which
# Django can't do without losing the body).
urlpatterns = [
    re_path(r"^csrf/?$", views.csrf, name="csrf"),
    re_path(r"^request-code/?$", views.request_code, name="request-code"),
    re_path(r"^verify-code/?$", views.verify_code, name="verify-code"),
    re_path(r"^logout/?$", views.logout_view, name="logout"),
    re_path(r"^me/?$", views.me, name="me"),
    # Signed-in device management
    re_path(r"^sessions/?$", views.sessions_list, name="sessions"),
    re_path(r"^sessions/logout-others/?$", views.logout_others, name="logout-others"),
    re_path(r"^sessions/(?P<session_id>\d+)/revoke/?$", views.revoke_session, name="revoke-session"),
    # Preferences, contact change (secure OTP), and data export
    re_path(r"^preferences/?$", views.preferences, name="preferences"),
    re_path(r"^change-contact/request/?$", views.change_contact_request, name="change-contact-request"),
    re_path(r"^change-contact/verify/?$", views.change_contact_verify, name="change-contact-verify"),
    re_path(r"^export/?$", views.export_data, name="export"),
]
