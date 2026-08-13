"""Force a password change before a freshly-provisioned staff account can use
the admin for anything else — set when a superuser generates a one-time
password for them (see UserAdmin.add_view / the "Generate password" button).
"""
from django.contrib import messages
from django.shortcuts import redirect
from django.urls import reverse

# Paths that must stay reachable even while a change is pending — the change
# form itself, its "done" landing page, and logout (never trap someone who
# just wants to sign out).
_EXEMPT_PATH_NAMES = {"admin:password_change", "admin:password_change_done", "admin:logout"}


class MustChangePasswordMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self._exempt_paths = None

    def _exempt(self):
        if self._exempt_paths is None:
            self._exempt_paths = {reverse(name) for name in _EXEMPT_PATH_NAMES}
        return self._exempt_paths

    def __call__(self, request):
        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated and getattr(user, "must_change_password", False):
            if request.path == reverse("admin:password_change_done"):
                # Django's PasswordChangeView only redirects here on success.
                user.must_change_password = False
                user.save(update_fields=["must_change_password"])
            elif request.path not in self._exempt() and request.path.startswith("/admin/"):
                messages.warning(request, "Set a new password before continuing.")
                return redirect(reverse("admin:password_change"))
        return self.get_response(request)
