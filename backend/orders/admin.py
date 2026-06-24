from django.contrib import admin

from .models import Order, OrderItem, OrderStatus


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ("title", "warehouse", "unit_price", "quantity", "line_total")
    readonly_fields = ("line_total",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "customer", "status", "carrier", "total", "item_count", "placed_at")
    list_filter = ("status", "carrier")
    search_fields = ("reference", "user__email", "user__phone", "ship_city")
    readonly_fields = ("reference", "total", "created_at", "updated_at")
    inlines = [OrderItemInline]
    actions = ["mark_queue", "mark_sourcing", "mark_transit", "mark_delivered", "mark_cancelled"]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user").prefetch_related("items")

    @admin.display(description="Customer")
    def customer(self, obj):
        return obj.user.email or obj.user.phone or f"user #{obj.user_id}"

    @admin.display(description="Items")
    def item_count(self, obj):
        return sum(i.quantity for i in obj.items.all())

    def save_model(self, request, obj, form, change):
        """Notify the customer when staff change an order's status in the form."""
        old_status = None
        if change:
            old_status = Order.objects.filter(pk=obj.pk).values_list("status", flat=True).first()
        super().save_model(request, obj, form, change)
        if old_status is not None and old_status != obj.status:
            obj._notify_status_change()

    def _bulk_set(self, request, queryset, status):
        changed = 0
        for order in queryset:
            if order.status != status:
                order.set_status(status)  # posts an inbox update
                changed += 1
        self.message_user(request, f"Updated {changed} order(s) to {OrderStatus(status).label}.")

    @admin.action(description="Mark as In queue (paid)")
    def mark_queue(self, request, queryset):
        self._bulk_set(request, queryset, OrderStatus.QUEUE)

    @admin.action(description="Mark as Sourcing")
    def mark_sourcing(self, request, queryset):
        self._bulk_set(request, queryset, OrderStatus.SOURCING)

    @admin.action(description="Mark as In transit")
    def mark_transit(self, request, queryset):
        self._bulk_set(request, queryset, OrderStatus.TRANSIT)

    @admin.action(description="Mark as Delivered")
    def mark_delivered(self, request, queryset):
        self._bulk_set(request, queryset, OrderStatus.DELIVERED)

    @admin.action(description="Mark as Cancelled")
    def mark_cancelled(self, request, queryset):
        self._bulk_set(request, queryset, OrderStatus.CANCELLED)
