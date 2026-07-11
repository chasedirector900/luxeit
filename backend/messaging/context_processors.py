"""Admin badge count: support conversations where the customer spoke last.
Staff-only, admin pages only — one aggregate query."""
from .models import Thread, ThreadKind


def support_badges(request):
    if not request.path.startswith("/admin") or not getattr(request.user, "is_staff", False):
        return {}
    from .admin import _awaiting_reply_qs

    return {
        "support_awaiting_count": _awaiting_reply_qs(
            Thread.objects.filter(kind=ThreadKind.SUPPORT)
        ).count()
    }
