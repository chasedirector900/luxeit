from datetime import date

from django.contrib import admin, messages
from django.shortcuts import redirect, render
from django.urls import path, reverse
from django.utils import timezone

from .models import Order, OrderItem, OrderStatus, Shipment


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ("title", "variant_summary", "warehouse", "shipping_method", "unit_price", "quantity", "line_total")
    readonly_fields = ("variant_summary", "line_total")

    @admin.display(description="Variant")
    def variant_summary(self, obj):
        return obj.variant_label or "—"


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

    # ── Fulfilment board: batched sourcing, arrivals & local deliveries ─────
    def get_urls(self):
        custom = [path("fulfilment/", self.admin_site.admin_view(self.fulfilment_view), name="orders_shipment_fulfilment")]
        return custom + super().get_urls()

    def fulfilment_view(self, request):
        if request.method == "POST":
            return self._advance_batch(request)

        Q = OrderStatus
        sections = [
            {
                "key": "source",
                "title": "To source — buy from the China hub",
                "hint": "Paid orders waiting to be bought. Buy these quantities, then mark the batch.",
                "action": "Mark sourced & purchased",
                "show_carrier": True,
                "batches": self._aggregate(status_in=[Q.QUEUE], warehouse="china"),
            },
            {
                "key": "arrive",
                "title": "Arrivals — incoming by air & sea",
                "hint": "Sourced goods on the way. When a batch lands, mark it arrived — customers are told it's ready for collection.",
                "action": "Mark arrived (ready for collection)",
                "show_carrier": True,
                "batches": self._aggregate(status_in=[Q.SOURCING, Q.TRANSIT], warehouse="china"),
            },
            {
                "key": "deliver",
                "title": "Lusaka local — ready for delivery",
                "hint": "Local-stock orders. Mark a day's batch delivered once the rider drops them off.",
                "action": "Mark delivered",
                "show_carrier": False,
                "batches": self._aggregate(status_in=[Q.QUEUE, Q.SOURCING, Q.TRANSIT], warehouse="zambia"),
            },
        ]
        context = {**self.admin_site.each_context(request), "title": "Fulfilment board", "sections": sections}
        return render(request, "admin/orders/fulfilment.html", context)

    @staticmethod
    def _aggregate(*, status_in, warehouse):
        """Group demand into (day, carrier) batches, each listing the actual
        products to buy — thumbnail, title, the chosen variant (size/colour),
        qty, and a deep-link to the catalogue page. Distinct variants of the same
        product are separate buy-lines, since each is its own purchase. Aggregated
        in Python because the variant snapshot is JSON."""
        items = (
            OrderItem.objects.filter(shipment__status__in=status_in, warehouse=warehouse)
            .select_related("shipment__order")
        )
        batches: list = []
        bindex: dict = {}
        lindex: dict = {}
        for it in items:
            day = timezone.localdate(it.shipment.order.placed_at)
            bkey = (day, it.shipping_method)
            group = bindex.get(bkey)
            if group is None:
                group = {"day": day, "carrier": it.shipping_method, "items": [], "total": 0}
                bindex[bkey] = group
                batches.append(group)
            variant = it.variant_label
            lkey = (bkey, it.product_id, it.title, variant)
            line = lindex.get(lkey)
            if line is None:
                url = reverse("admin:products_product_change", args=[it.product_id]) if it.product_id else ""
                line = {"title": it.title, "image": it.image, "url": url, "variant": variant, "qty": 0}
                lindex[lkey] = line
                group["items"].append(line)
            line["qty"] += it.quantity
            group["total"] += it.quantity
        # Newest day first; carrier asc within a day; busiest line first.
        batches.sort(key=lambda b: b["carrier"])
        batches.sort(key=lambda b: b["day"], reverse=True)
        for b in batches:
            b["items"].sort(key=lambda r: (-r["qty"], r["title"]))
        return batches

    def _advance_batch(self, request):
        section = request.POST.get("section")
        carrier = request.POST.get("carrier", "")
        try:
            day = date.fromisoformat(request.POST.get("day", ""))
        except ValueError:
            self.message_user(request, "Invalid batch.", level=messages.ERROR)
            return redirect("admin:orders_shipment_fulfilment")

        Q = OrderStatus
        if section == "source":
            qs = Shipment.objects.filter(status=Q.QUEUE, warehouse="china", carrier=carrier, order__placed_at__date=day)
            new_status, label = Q.SOURCING, "sourced & purchased"
        elif section == "arrive":
            qs = Shipment.objects.filter(status__in=[Q.SOURCING, Q.TRANSIT], warehouse="china", carrier=carrier, order__placed_at__date=day)
            new_status, label = Q.DELIVERED, "arrived (ready for collection)"
        elif section == "deliver":
            qs = Shipment.objects.filter(status__in=[Q.QUEUE, Q.SOURCING, Q.TRANSIT], warehouse="zambia", order__placed_at__date=day)
            new_status, label = Q.DELIVERED, "delivered"
        else:
            self.message_user(request, "Unknown action.", level=messages.ERROR)
            return redirect("admin:orders_shipment_fulfilment")

        count = 0
        for shipment in qs:
            shipment.set_status(new_status)  # notifies the customer + rolls the order up
            count += 1
        self.message_user(request, f"Marked {count} shipment(s) as {label}.")
        return redirect("admin:orders_shipment_fulfilment")

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
