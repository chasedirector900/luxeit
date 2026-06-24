from django.conf import settings
from django.db import models
from django.db.models import F, Sum
from django.utils import timezone


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending payment"   # placed, awaiting payment
    QUEUE = "queue", "In queue"              # paid, waiting to be sourced
    SOURCING = "sourcing", "Sourcing"        # being bought from China
    TRANSIT = "transit", "In transit"        # on its way to the customer
    DELIVERED = "delivered", "Delivered"     # completed
    CANCELLED = "cancelled", "Cancelled"


class Carrier(models.TextChoices):
    AIR = "air", "Air"
    SEA = "sea", "Sea"


# Maps a fine-grained status to the four account "My Orders" buckets/tabs.
BUCKET_BY_STATUS = {
    OrderStatus.PENDING: "pending",
    OrderStatus.QUEUE: "queue",
    OrderStatus.SOURCING: "queue",
    OrderStatus.TRANSIT: "transit",
    OrderStatus.DELIVERED: "delivered",
    OrderStatus.CANCELLED: "cancelled",
}

# Customer-facing copy per status (mirrors the frontend ORDER_STATUS_META).
STATUS_META = {
    OrderStatus.PENDING: ("Pending Payment", "Awaiting payment"),
    OrderStatus.QUEUE: ("In Queue", "Paid — waiting to be sourced"),
    OrderStatus.SOURCING: ("Sourcing", "Being bought from China"),
    OrderStatus.TRANSIT: ("In Transit", "On its way to you"),
    OrderStatus.DELIVERED: ("Delivered", "Delivered"),
    OrderStatus.CANCELLED: ("Cancelled", "Order cancelled"),
}


class Order(models.Model):
    """A customer order and its current fulfilment state.

    Items carry snapshots of title/image/price so the order stays accurate even
    if a product is later edited or removed. Shipping is included in item prices.
    """

    reference = models.CharField(max_length=20, unique=True, blank=True)  # e.g. "LX-2041"
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="orders", on_delete=models.CASCADE)
    status = models.CharField(max_length=12, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    carrier = models.CharField(max_length=4, choices=Carrier.choices, blank=True)

    # Delivery address snapshot (taken at order time).
    ship_name = models.CharField(max_length=150, blank=True)
    ship_line1 = models.CharField(max_length=200, blank=True)
    ship_city = models.CharField(max_length=120, blank=True)
    ship_area = models.CharField(max_length=120, blank=True)
    ship_phone = models.CharField(max_length=20, blank=True)

    # Payment snapshot (masked, non-sensitive — never the raw card details).
    payment_brand = models.CharField(max_length=20, blank=True)
    payment_detail = models.CharField(max_length=40, blank=True)

    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    placed_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-placed_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["-placed_at"]),
        ]

    def __str__(self):
        return f"{self.reference} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.reference:
            # Human-friendly reference derived from the pk once it exists.
            Order.objects.filter(pk=self.pk).update(reference=f"LX-{2000 + self.pk}")
            self.reference = f"LX-{2000 + self.pk}"

    @property
    def bucket(self) -> str:
        return BUCKET_BY_STATUS.get(self.status, "pending")

    @property
    def status_label(self) -> str:
        return STATUS_META.get(self.status, (self.get_status_display(), ""))[0]

    @property
    def status_description(self) -> str:
        return STATUS_META.get(self.status, ("", ""))[1]

    def recalculate_total(self) -> None:
        agg = self.items.aggregate(total=Sum(F("unit_price") * F("quantity")))
        self.total = agg["total"] or 0
        self.save(update_fields=["total"])

    def set_status(self, status: str) -> None:
        """Transition the order, timestamp it, and notify the customer's inbox."""
        if status == self.status:
            return
        self.status = status
        self.save(update_fields=["status", "updated_at"])
        self.log_event(status)
        self._notify_status_change()

    def log_event(self, status: str, at=None) -> "OrderEvent":
        """Record that the order entered `status` at a point in time."""
        return self.events.create(status=status, created_at=at or timezone.now())

    def _notify_status_change(self) -> None:
        # Posted as an "order" thread message so the customer sees live updates.
        # Respects the user's 'Order updates' notification preference.
        from messaging.services import post_message, wants_notification
        from messaging.models import ThreadKind

        if not wants_notification(self.user, "order_updates"):
            return

        label, _desc = STATUS_META.get(self.status, (self.get_status_display(), ""))
        bodies = {
            OrderStatus.QUEUE: f"Payment received for order {self.reference}. It's now in the queue to be sourced.",
            OrderStatus.SOURCING: f"Good news — we're sourcing the items in order {self.reference} from our China hub.",
            OrderStatus.TRANSIT: f"Order {self.reference} is on its way to you.",
            OrderStatus.DELIVERED: f"Order {self.reference} has been delivered. Thanks for shopping with Luxeit!",
            OrderStatus.CANCELLED: f"Order {self.reference} has been cancelled. Contact support if you have questions.",
            OrderStatus.PENDING: f"Order {self.reference} is awaiting payment.",
        }
        post_message(
            user=self.user,
            kind=ThreadKind.ORDER,
            slug=f"order-{self.reference.lower()}",
            name=f"Order {self.reference}",
            body=bodies.get(self.status, f"Order {self.reference} is now {label}."),
        )


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    # Optional link to the catalogue product; snapshots below keep the line stable.
    product = models.ForeignKey(
        "products.Product", related_name="order_items", on_delete=models.SET_NULL, null=True, blank=True
    )
    title = models.CharField(max_length=200)
    image = models.CharField(max_length=2048, blank=True)
    warehouse = models.CharField(max_length=10, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantity} x {self.title}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity


class OrderEvent(models.Model):
    """A timestamped status transition — powers the tracking timeline dates."""

    order = models.ForeignKey(Order, related_name="events", on_delete=models.CASCADE)
    status = models.CharField(max_length=12, choices=OrderStatus.choices)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [models.Index(fields=["order", "created_at"])]

    def __str__(self):
        return f"{self.order.reference}: {self.status}"
