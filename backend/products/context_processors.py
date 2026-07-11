"""Admin badge counts for the catalogue side: bad reviews awaiting a reply.
Cheap single COUNT, staff-only, admin pages only."""
from .models import ProductReview
from .services import BAD_RATING_MAX


def review_badges(request):
    if not request.path.startswith("/admin") or not getattr(request.user, "is_staff", False):
        return {}
    return {
        "bad_review_count": ProductReview.objects.filter(
            rating__lte=BAD_RATING_MAX, reply_text=""
        ).count()
    }
