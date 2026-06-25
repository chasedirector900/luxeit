"""Inject fulfilment-board counts into the admin so a badge can show how many
daily batches are waiting — without opening the board. Cheap: one DISTINCT
count query, only for staff on admin pages."""
from django.db.models.functions import TruncDate

from .models import OrderStatus, Shipment


def _batch_count(status_in, warehouse) -> int:
    """Number of waiting (day × carrier) batches — one batch per day, exactly
    how the board groups them."""
    return (
        Shipment.objects.filter(status__in=status_in, warehouse=warehouse)
        .annotate(day=TruncDate("order__placed_at"))
        .values("day", "carrier")
        .distinct()
        .count()
    )


def fulfilment_badges(request):
    if not request.path.startswith("/admin") or not getattr(request.user, "is_staff", False):
        return {}
    return {"to_source_count": _batch_count([OrderStatus.QUEUE], "china")}
