import secrets
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create(self, *, email=None, phone=None, full_name="", password=None, **extra):
        if not email and not phone:
            raise ValueError("Users must have an email or a phone number.")
        email = self.normalize_email(email) if email else None
        user = self.model(email=email, phone=phone or None, full_name=full_name, **extra)
        if password:
            user.set_password(password)
        else:
            # Passwordless account — auth happens via one-time codes.
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, email=None, phone=None, full_name="", password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create(email=email, phone=phone, full_name=full_name, password=password, **extra)

    def create_superuser(self, email=None, phone=None, full_name="", password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        if not email:
            raise ValueError("Superusers must have an email.")
        if not password:
            raise ValueError("Superusers must have a password.")
        return self._create(email=email, phone=phone, full_name=full_name, password=password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    """Passwordless user — identified by email and/or phone, authenticated via OTP."""

    email = models.EmailField(unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=150, blank=True)

    # Primary delivery address (mirrors the frontend Address: line1/city/area).
    address_line1 = models.CharField(max_length=200, blank=True)
    address_city = models.CharField(max_length=120, blank=True)
    address_area = models.CharField(max_length=120, blank=True)

    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    # email is the canonical username field (superusers always have one); phone-only
    # accounts are looked up directly in the OTP flow, not via Django's auth backend.
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email or self.phone or f"user#{self.pk}"


class LoginCode(models.Model):
    """A one-time code sent to an email or phone for passwordless login."""

    CHANNEL_EMAIL = "email"
    CHANNEL_PHONE = "phone"
    CHANNEL_CHOICES = [(CHANNEL_EMAIL, "Email"), (CHANNEL_PHONE, "Phone")]

    TTL_MINUTES = 10
    MAX_ATTEMPTS = 5

    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    destination = models.CharField(max_length=255)
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["destination", "used", "expires_at"])]

    def __str__(self):
        return f"{self.channel}:{self.destination} ({'used' if self.used else 'active'})"

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @classmethod
    def issue(cls, channel: str, destination: str) -> tuple["LoginCode", str]:
        """Create a fresh code, invalidating prior unused codes for the destination."""
        cls.objects.filter(destination=destination, used=False).update(used=True)
        code = f"{secrets.randbelow(1_000_000):06d}"
        obj = cls.objects.create(
            channel=channel,
            destination=destination,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=cls.TTL_MINUTES),
        )
        return obj, code

    def verify(self, code: str) -> bool:
        if self.used or self.is_expired or self.attempts >= self.MAX_ATTEMPTS:
            return False
        self.attempts += 1
        matched = check_password(code, self.code_hash)
        if matched:
            self.used = True
        self.save(update_fields=["attempts", "used"])
        return matched


class UserSession(models.Model):
    """One row per device a user is signed in on (linked to a Django session)."""

    user = models.ForeignKey(User, related_name="sessions", on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40, unique=True, db_index=True)
    device_label = models.CharField(max_length=200, blank=True)  # "Chrome on Windows"
    user_agent = models.CharField(max_length=400, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    last_seen = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-last_seen"]

    def __str__(self):
        return f"{self.user} - {self.device_label}"


class NotificationPreferences(models.Model):
    """Per-user toggles for which message kinds the user wants to receive."""

    user = models.OneToOneField(User, related_name="notification_prefs", on_delete=models.CASCADE)
    promotions = models.BooleanField(default=True)
    order_updates = models.BooleanField(default=True)
    system_alerts = models.BooleanField(default=True)

    def __str__(self):
        return f"prefs for {self.user}"
