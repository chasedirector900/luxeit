from django.conf import settings
from django.db import models
from django.db.models import F, Sum
from django.utils import timezone


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending payment"   # placed, awaiting payment
    QUEUE = "queue", "Sourcing"              # paid, being bought from China
    # Set by "Mark sourced & purchased": the goods are BOUGHT and sitting at the
    # hub waiting for a shipment to depart. (The value stays "sourcing" so no
    # data migration is needed; only the customer-facing label changed.)
    SOURCED = "sourcing", "Sourced"
    TRANSIT = "transit", "In transit"        # on its way to the customer
    DELIVERED = "delivered", "Delivered"     # completed
    CANCELLED = "cancelled", "Cancelled"


class Carrier(models.TextChoices):
    AIR = "air", "Air"
    SEA = "sea", "Sea"


class ItemCarrier(models.TextChoices):
    """How a single line ships. China goods go air or sea (per item); Zambia
    goods are local stock."""
    AIR = "air", "Air"
    SEA = "sea", "Sea"
    LOCAL = "local", "Local"


# Per-(hub, method) delivery estimates for grouped shipments.
SHIPMENT_ETA = {
    ("china", "air"): "About 2 weeks (Air)",
    ("china", "sea"): "About 2 months (Sea)",
    ("zambia", "local"): "1-2 days (Lusaka)",
}
SHIPMENT_LABEL = {
    ("china", "air"): "China Hub · Air",
    ("china", "sea"): "China Hub · Sea",
    ("zambia", "local"): "Lusaka Hub · Local",
}


# Maps a fine-grained status to the four account "My Orders" buckets/tabs.
BUCKET_BY_STATUS = {
    OrderStatus.PENDING: "pending",
    OrderStatus.QUEUE: "queue",
    OrderStatus.SOURCED: "queue",
    OrderStatus.TRANSIT: "transit",
    OrderStatus.DELIVERED: "delivered",
    OrderStatus.CANCELLED: "cancelled",
}

# Customer-facing copy per status (mirrors the frontend ORDER_STATUS_META).
STATUS_META = {
    OrderStatus.PENDING: ("Pending Payment", "Awaiting payment"),
    OrderStatus.QUEUE: ("Sourcing", "Paid — we're buying your items"),
    OrderStatus.SOURCED: ("Sourced", "Bought — waiting to ship"),
    OrderStatus.TRANSIT: ("In Transit", "On its way to you"),
    OrderStatus.DELIVERED: ("Delivered", "Delivered"),
    OrderStatus.CANCELLED: ("Cancelled", "Order cancelled"),
}

# Progression order — used to roll several shipment statuses up to one order
# status (the order is only as far along as its least-advanced shipment).
STATUS_RANK = {
    OrderStatus.PENDING: 0,
    OrderStatus.QUEUE: 1,
    OrderStatus.SOURCED: 2,
    OrderStatus.TRANSIT: 3,
    OrderStatus.DELIVERED: 4,
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

    # Duplicate-submit shield: checkout sends a random key per attempt; retries
    # (double-tap, flaky network, refresh) return the SAME order instead of
    # creating a second one. Blank for legacy/seeded orders.
    idempotency_key = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        ordering = ["-placed_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["-placed_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "idempotency_key"],
                condition=~models.Q(idempotency_key=""),
                name="uniq_order_user_idempotency_key",
            ),
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

    def recalculate_status(self) -> None:
        """Roll the shipment statuses up to one order status: the order is only
        as far along as its least-advanced (non-cancelled) shipment. With no
        shipments left active, the order is cancelled."""
        statuses = [s.status for s in self.shipments.all()]
        if not statuses:
            return
        active = [s for s in statuses if s != OrderStatus.CANCELLED]
        rollup = min(active, key=lambda s: STATUS_RANK.get(s, 0)) if active else OrderStatus.CANCELLED
        if rollup != self.status:
            self.status = rollup
            self.save(update_fields=["status", "updated_at"])


def _rollup(statuses) -> str:
    """The least-advanced (non-cancelled) status of a group; all-cancelled ->
    cancelled. Shared by Shipment (over items) and Order (over shipments)."""
    active = [s for s in statuses if s != OrderStatus.CANCELLED]
    if not active:
        return OrderStatus.CANCELLED
    return min(active, key=lambda s: STATUS_RANK.get(s, 0))


class Shipment(models.Model):
    """A fulfilment parcel within an order: a (hub, carrier) group of items that
    moves through its own status timeline. China-air can be delivered while
    China-sea is still in transit — all under one order/payment."""

    order = models.ForeignKey(Order, related_name="shipments", on_delete=models.CASCADE)
    warehouse = models.CharField(max_length=10)  # china / zambia
    carrier = models.CharField(max_length=6, choices=ItemCarrier.choices)  # air / sea / local
    status = models.CharField(max_length=12, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    placed_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.order.reference} · {self.label}"

    @property
    def key(self) -> tuple:
        return (self.warehouse, self.carrier)

    @property
    def label(self) -> str:
        return SHIPMENT_LABEL.get(self.key, f"{self.warehouse} · {self.carrier}")

    @property
    def eta(self) -> str:
        return SHIPMENT_ETA.get(self.key, "")

    @property
    def bucket(self) -> str:
        return BUCKET_BY_STATUS.get(self.status, "pending")

    @property
    def status_label(self) -> str:
        return STATUS_META.get(self.status, (self.status, ""))[0]

    @property
    def status_description(self) -> str:
        return STATUS_META.get(self.status, ("", ""))[1]

    def subtotal(self):
        return sum((i.line_total for i in self.items.all()), 0)

    def set_status(self, status: str) -> None:
        """Advance the whole shipment (and all its items), timestamp it, notify
        the customer, and roll the parent order's status up. Used by the bulk
        changelist actions; the board advances individual items instead."""
        if status == self.status:
            return
        self.items.update(status=status)  # the shipment moves as one unit
        self.status = status
        self.save(update_fields=["status", "updated_at"])
        self.log_event(status)
        self._notify()
        self.order.recalculate_status()

    def recalculate_status(self) -> bool:
        """Roll this shipment's status up from its items — it's only as far along
        as its least-advanced item. Logs a timeline event on change (no notify;
        the item-level advance notifies per product). Returns True if changed."""
        statuses = [i.status for i in self.items.all()]
        if not statuses:
            return False
        rollup = _rollup(statuses)
        if rollup == self.status:
            return False
        self.status = rollup
        self.save(update_fields=["status", "updated_at"])
        self.log_event(rollup)
        self.order.recalculate_status()
        return True

    def log_event(self, status: str, at=None) -> "ShipmentEvent":
        return self.events.create(status=status, created_at=at or timezone.now())

    def _notify(self) -> None:
        # One inbox update per shipment transition (respects the user's pref).
        from messaging.services import post_message, wants_notification
        from messaging.models import ThreadKind

        if not wants_notification(self.order.user, "order_updates"):
            return
        ref = self.order.reference
        # China goods land at the hub for collection; Zambia goods are delivered.
        delivered = (
            f"Good news — your {self.label} order ({ref}) has arrived and is ready for collection."
            if self.warehouse == "china"
            else f"Your {self.label} order ({ref}) has been delivered. Enjoy!"
        )
        bodies = {
            OrderStatus.QUEUE: f"Payment received — we're now sourcing your {self.label} items ({ref}).",
            OrderStatus.SOURCED: (
                f"We've sourced & purchased your {self.label} items in order {ref} — "
                + (
                    "they're at our China hub waiting to ship."
                    if self.warehouse == "china"
                    else "they're being prepared for delivery."
                )
            ),
            OrderStatus.TRANSIT: f"Your {self.label} shipment for order {ref} is on its way.",
            OrderStatus.DELIVERED: delivered,
            OrderStatus.CANCELLED: f"Your {self.label} shipment for order {ref} was cancelled.",
            OrderStatus.PENDING: f"Order {ref} is awaiting payment.",
        }
        post_message(
            user=self.order.user,
            kind=ThreadKind.ORDER,
            slug=f"order-{ref.lower()}",
            name=f"Order {ref}",
            body=bodies.get(self.status, f"Your {self.label} ({ref}) is now {self.status_label}."),
        )


class ShipmentEvent(models.Model):
    """A timestamped shipment transition — powers the per-shipment timeline."""

    shipment = models.ForeignKey(Shipment, related_name="events", on_delete=models.CASCADE)
    status = models.CharField(max_length=12, choices=OrderStatus.choices)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [models.Index(fields=["shipment", "created_at"])]

    def __str__(self):
        return f"{self.shipment_id}: {self.status}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    shipment = models.ForeignKey(Shipment, related_name="items", on_delete=models.CASCADE, null=True, blank=True)
    # Optional link to the catalogue product; snapshots below keep the line stable.
    product = models.ForeignKey(
        "products.Product", related_name="order_items", on_delete=models.SET_NULL, null=True, blank=True
    )
    title = models.CharField(max_length=200)
    image = models.CharField(max_length=2048, blank=True)
    warehouse = models.CharField(max_length=10, blank=True)
    # How THIS line ships (air/sea for China, local for Zambia). Lets one order
    # carry, e.g., 2 China items by air and the rest by sea.
    shipping_method = models.CharField(max_length=6, choices=ItemCarrier.choices, blank=True)
    # The variant the customer chose, snapshotted as {label: value}, e.g.
    # {"Size": "42", "Colour": "Red"} — so the buyer sources the exact item.
    variant = models.JSONField(default=dict, blank=True)
    # Per-item fulfilment status: the source of truth the board advances. A
    # parcel's shoes can be sourced while its bags are still queued; the shipment
    # (and order) status roll up from these.
    status = models.CharField(max_length=12, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantity} x {self.title}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    @property
    def variant_label(self) -> str:
        """Human-readable variant, e.g. 'Size: 42 · Colour: Red'. Empty if none."""
        if not isinstance(self.variant, dict) or not self.variant:
            return ""
        return " · ".join(f"{k}: {v}" for k, v in self.variant.items())

    @property
    def status_label(self) -> str:
        return STATUS_META.get(self.status, (self.status, ""))[0]
