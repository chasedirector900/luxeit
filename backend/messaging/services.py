"""Helpers for posting messages into a user's inbox.

Used by other apps (e.g. new-device alerts), the admin, and management commands.
Threads are per-user; broadcasting fans a promo out to every active user.
"""
from django.contrib.auth import get_user_model

from .models import Message, SenderRole, Thread, ThreadKind


def post_message(*, user, kind: str, slug: str, name: str, body: str,
                 sender: str = SenderRole.LUXEIT, read: bool = False) -> Message:
    """Append a message to the user's thread (creating the thread if needed)."""
    thread, _ = Thread.objects.get_or_create(
        user=user, slug=slug, defaults={"kind": kind, "name": name}
    )
    message = Message.objects.create(thread=thread, sender=sender, body=body, read=read)
    thread.touch()
    return message


def wants_notification(user, field: str) -> bool:
    """Whether the user opted in to a notification category (defaults to True)."""
    from users.models import NotificationPreferences

    prefs, _ = NotificationPreferences.objects.get_or_create(user=user)
    return getattr(prefs, field, True)


def post_system_message(user, body: str):
    """An automated system alert (new device, profile reminders, ...).

    Respects the user's 'Account & security' (system_alerts) preference.
    """
    if not wants_notification(user, "system_alerts"):
        return None
    return post_message(
        user=user, kind=ThreadKind.SYSTEM, slug="luxeit", name="Luxeit",
        body=body, sender=SenderRole.SYSTEM,
    )


def post_welcome(user) -> Message:
    return post_message(
        user=user, kind=ThreadKind.SYSTEM, slug="luxeit", name="Luxeit", sender=SenderRole.LUXEIT,
        body=(
            "Welcome to Luxeit! We bring quality China imports straight to your door in "
            "Zambia — with shipping always included in the price."
        ),
    )


SUPPORT_THREAD_NAME = "Luxeit Support"
SUPPORT_GREETING = (
    "Hi! 👋 You're chatting with Luxeit Support. Tell us what you need help with — "
    "an order, a delivery, a payment, or anything else — and our team will reply "
    "here as soon as possible."
)


def get_or_create_support_thread(user) -> Thread:
    """The user's live-support conversation, seeded with a greeting on first open.

    Support threads are two-way: the customer can reply (Thread.can_reply) and a
    human agent answers from the Django admin (a Message with sender=SUPPORT).
    We seed the greeting on creation so opening support always shows a real
    conversation to start from, never an empty screen.
    """
    thread, _ = Thread.objects.get_or_create(
        user=user, slug="support",
        defaults={"kind": ThreadKind.SUPPORT, "name": SUPPORT_THREAD_NAME},
    )
    # Seed the greeting if the thread is empty. This covers both a brand-new
    # thread and any older empty thread left over before greetings existed, so
    # support never opens to a blank "conversation no longer exists" screen.
    if not thread.messages.exists():
        Message.objects.create(
            thread=thread, sender=SenderRole.SUPPORT, body=SUPPORT_GREETING, read=False,
        )
        thread.touch()
    return thread


def broadcast_promo(body: str, *, slug: str = "luxeit-promotions", name: str = "Luxeit Promotions") -> int:
    """Send a promotion to every active user who hasn't opted out. Returns count reached."""
    from users.models import NotificationPreferences

    User = get_user_model()
    opted_out = set(
        NotificationPreferences.objects.filter(promotions=False).values_list("user_id", flat=True)
    )
    count = 0
    for user in User.objects.filter(is_active=True):
        if user.id in opted_out:
            continue
        post_message(user=user, kind=ThreadKind.PROMO, slug=slug, name=name, body=body)
        count += 1
    return count
