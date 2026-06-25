from django.contrib import admin

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

    list_display = ("order_ref", "customer", "label", "status", "updated_at")
    list_filter = ("status", "warehouse", "carrier")
    search_fields = ("order__reference", "order__user__email", "order__user__phone")
    actions = ["mark_queue", "mark_sourcing", "mark_transit", "mark_delivered", "mark_cancelled"]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("order", "order__user")

    @admin.display(description="Order")
    def order_ref(self, obj):
        return obj.order.reference

    @admin.display(description="Customer")
    def customer(self, obj):
        return obj.order.user.email or obj.order.user.phone or f"user #{obj.order.user_id}"

    def _bulk(self, request, queryset, status):
        changed = 0
        for shipment in queryset:
            if shipment.status != status:
                shipment.set_status(status)  # notifies + rolls the order up
                changed += 1
        self.message_user(request, f"Updated {changed} shipment(s) to {OrderStatus(status).label}.")

    @admin.action(description="Mark as In queue (paid)")
    def mark_queue(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.QUEUE)

    @admin.action(description="Mark as Sourcing")
    def mark_sourcing(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.SOURCING)

    @admin.action(description="Mark as In transit")
    def mark_transit(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.TRANSIT)

    @admin.action(description="Mark as Delivered")
    def mark_delivered(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.DELIVERED)

    @admin.action(description="Mark as Cancelled")
    def mark_cancelled(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.CANCELLED)
