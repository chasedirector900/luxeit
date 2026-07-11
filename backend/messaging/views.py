from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.throttling import SupportMessageThrottle

from .models import Message, SenderRole
from .serializers import ThreadSerializer
from .services import get_or_create_support_thread


def _user_thread(request, slug):
    """Fetch the user's thread; the live-support thread is created (and seeded
    with a greeting) on demand so users can start chatting with Luxeit."""
    if slug == "support":
        return get_or_create_support_thread(request.user)
    return get_object_or_404(request.user.threads, slug=slug)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def threads_list(request):
    """All of the current user's conversations (with messages)."""
    threads = request.user.threads.prefetch_related(
        Prefetch("messages", queryset=Message.objects.select_related("agent"))
    )
    return Response(ThreadSerializer(threads, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def thread_detail(request, slug):
    """One conversation — used by the detail screen and for polling."""
    return Response(ThreadSerializer(_user_thread(request, slug)).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([SupportMessageThrottle])
def send_message(request, slug):
    """Send a message — only allowed on the live-support thread."""
    thread = _user_thread(request, slug)
    if not thread.can_reply:
        return Response(
            {"detail": "You can't reply to these messages."},
            status=status.HTTP_403_FORBIDDEN,
        )
    body = (request.data.get("body") or "").strip()
    if not body:
        return Response({"detail": "Message can't be empty."}, status=status.HTTP_400_BAD_REQUEST)

    Message.objects.create(thread=thread, sender=SenderRole.USER, body=body, read=True)
    thread.touch()
    return Response(ThreadSerializer(thread).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_thread_read(request, slug):
    """Mark every message in a thread as read."""
    thread = get_object_or_404(request.user.threads, slug=slug)
    thread.messages.filter(read=False).update(read=True)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def read_all(request):
    """Mark all of the user's messages read."""
    Message.objects.filter(thread__user=request.user, read=False).update(read=True)
    return Response(status=status.HTTP_204_NO_CONTENT)
