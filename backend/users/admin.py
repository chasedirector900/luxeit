from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

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
    list_display = ("id", "email", "phone", "full_name", "is_active", "is_staff", "date_joined")
    list_filter = ("is_active", "is_staff", "is_superuser", "email_verified", "phone_verified")
    search_fields = ("email", "phone", "full_name")
    readonly_fields = ("date_joined", "last_login")

    fieldsets = (
        (None, {"fields": ("email", "phone", "password")}),
        ("Profile", {"fields": ("full_name", "email_verified", "phone_verified")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "phone", "full_name", "password1", "password2"),
        }),
    )


@admin.register(LoginCode)
class LoginCodeAdmin(SuperuserOnlyAdmin, admin.ModelAdmin):
    list_display = ("id", "channel", "destination", "used", "attempts", "created_at", "expires_at")
    list_filter = ("channel", "used")
    search_fields = ("destination",)
    readonly_fields = ("channel", "destination", "code_hash", "created_at", "expires_at", "attempts", "used")
