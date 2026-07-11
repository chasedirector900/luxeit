"""Product-side notifications for the ops team."""
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.urls import reverse

logger = logging.getLogger(__name__)

BAD_RATING_MAX = 2  # 1–2★ counts as a bad review


def alert_staff_bad_review(review, request=None) -> None:
    """Email every staff member when a customer leaves a 1–2★ review, so an
    unhappy customer is never missed. Failures are logged, never raised — an
    alert must not break review submission."""
    User = get_user_model()
    recipients = list(
        User.objects.filter(is_staff=True, is_active=True)
        .exclude(email="").exclude(email__isnull=True)
        .values_list("email", flat=True)
    )
    if not recipients:
        return

    path = reverse("admin:products_productreview_moderation") + "?filter=bad"
    link = request.build_absolute_uri(path) if request is not None else path
    stars = "★" * review.rating + "☆" * (5 - review.rating)
    body = (
        f"{review.user_name} left a {review.rating}-star review ({stars}) on "
        f"“{review.product.title}”.\n\n"
        f"“{(review.text or '(no written comment)')[:500]}”\n\n"
        f"Reply to them from the moderation board:\n{link}\n"
    )
    try:
        send_mail(
            subject=f"⚠ Bad review: {review.rating}★ on {review.product.title}",
            message=body,
            from_email=None,  # DEFAULT_FROM_EMAIL
            recipient_list=recipients,
            fail_silently=False,
        )
    except Exception:  # pragma: no cover - depends on the email backend
        logger.exception("Bad-review alert email failed (review id=%s)", review.pk)
