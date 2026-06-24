from rest_framework import serializers

from .models import NotificationPreferences, User, UserSession


class UserSerializer(serializers.ModelSerializer):
    address = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "email_verified",
            "phone_verified",
            "address",
            "date_joined",
        ]
        read_only_fields = fields

    def get_address(self, obj: User):
        """Nested {line1, city, area} (matches the frontend Address), or null."""
        if not (obj.address_line1 or obj.address_city or obj.address_area):
            return None
        return {"line1": obj.address_line1, "city": obj.address_city, "area": obj.address_area}


class NotificationPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreferences
        fields = ["promotions", "order_updates", "system_alerts"]


class UserSessionSerializer(serializers.BaseSerializer):
    """A signed-in device. `current` marks the session making the request."""

    def to_representation(self, obj: UserSession) -> dict:
        return {
            "id": obj.id,
            "deviceLabel": obj.device_label or "Unknown device",
            "ip": obj.ip_address or "",
            "lastSeen": obj.last_seen.isoformat(),
            "createdAt": obj.created_at.isoformat(),
            "current": obj.session_key == self.context.get("current"),
        }
