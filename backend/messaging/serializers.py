"""Serializers emitting the frontend notification-channel / message shape."""
from django.utils import timezone

from rest_framework import serializers

from .models import Message, SenderRole, Thread


def _date_label(dt) -> str:
    """Day-group label like the frontend expects: 'Today' / 'Yesterday' / 'Jun 12'."""
    local = timezone.localtime(dt)
    today = timezone.localtime(timezone.now()).date()
    delta = (today - local.date()).days
    if delta <= 0:
        return "Today"
    if delta == 1:
        return "Yesterday"
    return f"{local.strftime('%b')} {local.day}"  # e.g. "Jun 12" (cross-platform)


def _message_dict(message: Message) -> dict:
    local = timezone.localtime(message.created_at)
    return {
        "id": str(message.id),
        "text": message.body,
        "date": _date_label(message.created_at),
        "time": local.strftime("%H:%M"),
        "read": message.read,
        "sender": message.sender,
        "fromUser": message.sender == SenderRole.USER,
        "agentName": message.agent_name,  # who at Luxeit replied (support only)
    }


class ThreadSerializer(serializers.BaseSerializer):
    """Full channel: metadata + ordered messages (oldest → newest)."""

    def to_representation(self, thread: Thread) -> dict:
        messages = list(thread.messages.all())
        unread = sum(1 for m in messages if not m.read and m.sender != SenderRole.USER)
        return {
            "id": str(thread.id),
            "slug": thread.slug,
            "name": thread.name,
            "type": thread.kind,
            "canReply": thread.can_reply,
            "unread": unread,
            "messages": [_message_dict(m) for m in messages],
        }
