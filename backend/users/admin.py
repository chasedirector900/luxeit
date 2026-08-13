from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html, format_html_join

from .models import LoginCode, User


class SuperuserOnlyAdmin:
    """Locks a ModelAdmin to the superuser, regardless of what a Group grants.

    Customer accounts and login codes are exactly what "staff shouldn't see
    the customer list" means, and staff managing their own `is_staff`/
    `is_superuser`/permissions here would be a privilege-escalation hole — so
    this is hardcoded rather than left to Group permissions that could later
    be misconfigured.
    """

    def has_module_permission(self, request):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(User)
class UserAdmin(SuperuserOnlyAdmin, BaseUserAdmin):
    ordering = ("-date_joined",)
    list_display = ("id", "email", "phone", "full_name", "is_active", "is_staff", "last_login", "date_joined")
    list_filter = ("is_active", "is_staff", "is_superuser", "email_verified", "phone_verified")
    search_fields = ("email", "phone", "full_name")
    readonly_fields = ("date_joined", "last_login", "login_activity")

    # The dedicated "set/change password" view for an *existing* user doesn't
    # include ModelAdmin.Media the way add/change views do — needed for
    # promoting an existing customer-created account to staff.
    change_user_password_template = "admin/users/change_password.html"

    class Media:
        # No-ops on the change form (no password1/password2 there) — only
        # active on "Add user", where it adds the Generate-password button.
        js = ("users/js/generate_password.js",)

    fieldsets = (
        (None, {"fields": ("email", "phone", "password")}),
        ("Profile", {"fields": ("full_name", "email_verified", "phone_verified")}),
        ("Permissions", {
            "fields": ("is_active", "is_staff", "is_superuser", "must_change_password", "groups", "user_permissions"),
        }),
        ("Dates & activity", {"fields": ("last_login", "date_joined", "login_activity")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "phone", "full_name", "password1", "password2", "must_change_password"),
        }),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj is None and "must_change_password" in form.base_fields:
            # New accounts default to requiring a change — matches handing
            # someone a freshly generated one-time password.
            form.base_fields["must_change_password"].initial = True
        return form

    @admin.display(description="Recent sign-ins")
    def login_activity(self, obj):
        if obj is None:
            return "—"
        sessions = obj.sessions.all()[:8]
        if not sessions:
            return "No recorded sign-ins yet."
        rows = format_html_join(
            "",
            "<tr><td style='padding-right:16px;'>{}</td><td style='padding-right:16px;'>{}</td><td>{}</td></tr>",
            (
                (s.last_seen.strftime("%Y-%m-%d %H:%M"), s.device_label or "Unknown device", s.ip_address or "—")
                for s in sessions
            ),
        )
        return format_html(
            '<table><thead><tr><th style="padding-right:16px;">When</th>'
            '<th style="padding-right:16px;">Device</th><th>IP</th></tr></thead>'
            "<tbody>{}</tbody></table>",
            rows,
        )


@admin.register(LoginCode)
class LoginCodeAdmin(SuperuserOnlyAdmin, admin.ModelAdmin):
    list_display = ("id", "channel", "destination", "used", "attempts", "created_at", "expires_at")
    list_filter = ("channel", "used")
    search_fields = ("destination",)
    readonly_fields = ("channel", "destination", "code_hash", "created_at", "expires_at", "attempts", "used")
