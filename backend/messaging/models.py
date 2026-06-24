from django.conf import settings
from django.db import models
from django.utils import timezone


class ThreadKind(models.TextChoices):
    PROMO = "promo", "Promotions"
    SYSTEM = "system", "System"
    ORDER = "order", "Orders"
    DELIVERY = "delivery", "Delivery"
    SUPPORT = "support", "Live support"


class SenderRole(models.TextChoices):
    LUXEIT = "luxeit", "Luxeit"        # editorial / promos
    SYSTEM = "system", "System"        # automated alerts (new device, welcome)
    SUPPORT = "support", "Support"     # a human support agent
    USER = "user", "User"             # the customer (only on support threads)


class Thread(models.Model):
    """A per-user conversation. Most kinds are one-way; `support` is two-way."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="threads", on_delete=models.CASCADE)
    kind = models.CharField(max_length=10, choices=ThreadKind.choices)
    slug = models.SlugField()           # readable URL segment, unique per user
    name = models.CharField(max_length=120)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)  # last activity, for ordering

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "slug"], name="uniq_user_thread_slug"),
        ]
        indexes = [models.Index(fields=["user", "-updated_at"])]

    def __str__(self):
        return f"{self.user} - {self.name}"

    @property
    def can_reply(self) -> bool:
        """Only live-support threads accept replies from the user."""
        return self.kind == ThreadKind.SUPPORT

    def touch(self) -> None:
        self.updated_at = timezone.now()
        self.save(update_fields=["updated_at"])


class Message(models.Model):
    thread = models.ForeignKey(Thread, related_name="messages", on_delete=models.CASCADE)
    sender = models.CharField(max_length=10, choices=SenderRole.choices, default=SenderRole.LUXEIT)
    # The staff member who authored a human support reply (sender=SUPPORT). Null
    # for the customer's own messages and for automated/editorial messages.
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="support_replies",
        null=True, blank=True, on_delete=models.SET_NULL,
    )
    body = models.TextField()
    # Read by the thread's owner (the customer). Inbound user messages start read.
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["thread", "created_at"])]

    def __str__(self):
        return f"{self.sender}: {self.body[:40]}"

    @property
    def from_user(self) -> bool:
        return self.sender == SenderRole.USER

    @property
    def agent_name(self) -> str | None:
        """Display name shown to the customer for a support reply.

        A named staff member -> a support handle like "chasedirector@luxeitsupport";
        an automated support message (e.g. the greeting, no agent) -> the generic
        team name. Non-support messages have no agent name.
        """
        if self.sender != SenderRole.SUPPORT:
            return None
        if self.agent_id:
            return f"{self._agent_handle()}@luxeitsupport"
        return "Luxeit Support"

    def _agent_handle(self) -> str:
        """A clean, single-token handle for the support agent."""
        agent = self.agent
        if agent.email:
            return agent.email.split("@")[0].lower()
        name = (agent.full_name or "").strip()
        if name:
            return name.lower().replace(" ", ".")
        if agent.phone:
            return agent.phone
        return f"agent{agent.id}"
