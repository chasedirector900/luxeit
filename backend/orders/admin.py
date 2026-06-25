from datetime import date

from django.contrib import admin, messages
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.shortcuts import redirect, render
from django.urls import path

from .models import Order, OrderItem, OrderStatus, Shipment


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ("title", "warehouse", "shipping_method", "unit_price", "quantity", "line_total")
    readonly_fields = ("line_total",)


class ShipmentInline(admin.TabularInline):
    model = Shipment
    extra = 0
    fields = ("label", "status")
    readonly_fields = ("label",)
    show_change_link = True


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "customer", "status", "total", "item_count", "placed_at")
    list_filter = ("status",)
    search_fields = ("reference", "user__email", "user__phone", "ship_city")
    # status is rolled up from shipments — edit it on the shipments instead.
    readonly_fields = ("reference", "status", "total", "created_at", "updated_at")
    inlines = [ShipmentInline, OrderItemInline]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user").prefetch_related("items", "shipments")

    @admin.display(description="Customer")
    def customer(self, obj):
        return obj.user.email or obj.user.phone or f"user #{obj.user_id}"

    @admin.display(description="Items")
    def item_count(self, obj):
        return sum(i.quantity for i in obj.items.all())

    def save_formset(self, request, form, formset, change):
        """When a shipment's status is edited inline, notify + log + roll up."""
        if formset.model is Shipment:
            for obj in formset.save(commit=False):
                old = Shipment.objects.filter(pk=obj.pk).values_list("status", flat=True).first() if obj.pk else None
                obj.save()
                if old is not None and old != obj.status:
                    obj.log_event(obj.status)
                    obj._notify()
            for obj in formset.deleted_objects:
                obj.delete()
            formset.save_m2m()
            form.instance.recalculate_status()
        else:
            super().save_formset(request, form, formset, change)


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    """Advance individual parcels — China-air can be delivered while China-sea
    is still in transit. Each change notifies the customer and rolls the order up."""

    list_display = ("order_ref", "customer", "label", "items_summary", "status", "placed_at")
    list_filter = ("status", "warehouse", "carrier")
    search_fields = ("order__reference", "order__user__email", "order__user__phone", "items__title")
    date_hierarchy = "placed_at"
    ordering = ("-placed_at",)
    actions = ["mark_sourcing", "mark_transit", "mark_delivered", "mark_cancelled"]
    change_list_template = "admin/orders/shipment/change_list.html"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("order", "order__user").prefetch_related("items")

    @admin.display(description="Order")
    def order_ref(self, obj):
        return obj.order.reference

    @admin.display(description="Customer")
    def customer(self, obj):
        return obj.order.user.email or obj.order.user.phone or f"user #{obj.order.user_id}"

    @admin.display(description="Items")
    def items_summary(self, obj):
        return ", ".join(f"{i.quantity}× {i.title}" for i in obj.items.all()[:3]) or "—"

    # ── Sourcing board: batched buy-list for the procurement team ───────────
    def get_urls(self):
        custom = [path("sourcing/", self.admin_site.admin_view(self.sourcing_view), name="orders_shipment_sourcing")]
        return custom + super().get_urls()

    def sourcing_view(self, request):
        if request.method == "POST":
            return self._fulfil_batch(request)

        # Aggregate paid-but-unsourced China demand by (day, carrier, product).
        rows = (
            OrderItem.objects.filter(shipment__status=OrderStatus.QUEUE, warehouse="china")
            .annotate(day=TruncDate("shipment__order__placed_at"))
            .values("day", "shipping_method", "title")
            .annotate(qty=Sum("quantity"))
            .order_by("-day", "shipping_method", "-qty", "title")
        )
        batches: list = []
        index: dict = {}
        for r in rows:
            key = (r["day"], r["shipping_method"])
            group = index.get(key)
            if group is None:
                group = {"day": r["day"], "carrier": r["shipping_method"], "items": [], "total": 0}
                index[key] = group
                batches.append(group)
            group["items"].append({"title": r["title"], "qty": r["qty"]})
            group["total"] += r["qty"]

        context = {
            **self.admin_site.each_context(request),
            "title": "Sourcing board",
            "batches": batches,
        }
        return render(request, "admin/orders/sourcing.html", context)

    def _fulfil_batch(self, request):
        carrier = request.POST.get("carrier", "")
        try:
            day = date.fromisoformat(request.POST.get("day", ""))
        except ValueError:
            self.message_user(request, "Invalid batch.", level=messages.ERROR)
            return redirect("admin:orders_shipment_sourcing")

        shipments = Shipment.objects.filter(
            status=OrderStatus.QUEUE, warehouse="china", carrier=carrier, order__placed_at__date=day,
        )
        count = 0
        for shipment in shipments:
            shipment.set_status(OrderStatus.SOURCING)  # notifies the customer + rolls order up
            count += 1
        self.message_user(request, f"Marked {count} {carrier} shipment(s) from {day} as sourced & purchased.")
        return redirect("admin:orders_shipment_sourcing")

    # ── Bulk status actions (granular, from the changelist) ─────────────────
    def _bulk(self, request, queryset, status):
        changed = 0
        for shipment in queryset:
            if shipment.status != status:
                shipment.set_status(status)  # notifies + rolls the order up
                changed += 1
        self.message_user(request, f"Updated {changed} shipment(s) to {OrderStatus(status).label}.")

    @admin.action(description="Mark Sourced & purchased (→ Sourcing)")
    def mark_sourcing(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.SOURCING)

    @admin.action(description="Mark Shipped (→ In transit)")
    def mark_transit(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.TRANSIT)

    @admin.action(description="Mark Delivered")
    def mark_delivered(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.DELIVERED)

    @admin.action(description="Mark Cancelled")
    def mark_cancelled(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.CANCELLED)
