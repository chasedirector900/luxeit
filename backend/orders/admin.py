from datetime import date, timedelta

from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.db.models import Count, F, Sum
from django.shortcuts import redirect, render
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html

from .fulfilment import advance_items, cancel_unavailable_items
from .models import Order, OrderItem, OrderStatus, Shipment

# ── Shared display helpers (Bootstrap 5 + FontAwesome, from Jazzmin) ─────────
# Each status maps to a contextual colour + icon so the changelists read at a
# glance, matching the Fulfilment board.
_STATUS_BADGE = {
    OrderStatus.PENDING: ("secondary", "fa-hourglass-half"),
    OrderStatus.QUEUE: ("warning", "fa-clock"),
    OrderStatus.SOURCED: ("info", "fa-cart-shopping"),
    OrderStatus.TRANSIT: ("primary", "fa-truck-fast"),
    OrderStatus.DELIVERED: ("success", "fa-circle-check"),
    OrderStatus.CANCELLED: ("danger", "fa-ban"),
}
_CARRIER_ICON = {"air": "fa-plane", "sea": "fa-ship", "local": "fa-truck"}


def _status_badge(status):
    color, icon = _STATUS_BADGE.get(status, ("secondary", "fa-circle"))
    try:
        label = OrderStatus(status).label
    except ValueError:
        label = status
    return format_html('<span class="badge text-bg-{}"><i class="fas {} me-1"></i>{}</span>', color, icon, label)


def _kwacha(amount):
    return format_html('<span style="font-variant-numeric:tabular-nums;">K{}</span>', f"{amount:,.2f}")


# ── Time-range filtering ────────────────────────────────────────────────────
# Presets so the changelists never dump every record at once. Defaults to the
# last 30 days; "All time" is always available, and the date drill-down handles
# any custom period.
PERIOD_CHOICES = [
    ("today", "Today"),
    ("7", "Last 7 days"),
    ("30", "Last 30 days"),
    ("90", "Last 3 months"),
    ("180", "Last 6 months"),
    ("all", "All time"),
]
PERIOD_DEFAULT = "30"
PERIOD_LABEL = dict(PERIOD_CHOICES)


def filter_by_period(qs, field, value):
    """Restrict a queryset to a preset period on `field` (a datetime field)."""
    value = value or PERIOD_DEFAULT
    if value == "all":
        return qs
    if value == "today":
        return qs.filter(**{f"{field}__date": timezone.localdate()})
    try:
        days = int(value)
    except (TypeError, ValueError):
        days = int(PERIOD_DEFAULT)
    return qs.filter(**{f"{field}__gte": timezone.now() - timedelta(days=days)})


class PeriodFilter(admin.SimpleListFilter):
    """Sidebar preset periods, defaulting to the last 30 days. Backs off when the
    user drills into a specific date via the date hierarchy."""

    title = "period"
    parameter_name = "period"
    field = "placed_at"

    def lookups(self, request, model_admin):
        return PERIOD_CHOICES

    def queryset(self, request, queryset):
        # If a date-hierarchy drill-down is active and no period is chosen, let
        # the drill-down define the range instead of forcing the 30-day default.
        drilled = any(k.startswith(f"{self.field}__") for k in request.GET)
        if drilled and not self.value():
            return queryset
        return filter_by_period(queryset, self.field, self.value())

    def choices(self, changelist):
        current = self.value() or PERIOD_DEFAULT
        for value, label in PERIOD_CHOICES:
            yield {
                "selected": current == value,
                "query_string": changelist.get_query_string({self.parameter_name: value}),
                "display": label,
            }


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ("title", "variant_summary", "warehouse", "shipping_method", "status", "refunded", "unit_price", "quantity", "line_total")
    # status is the item-level truth, normally driven by the Fulfilment board;
    # shown here read-only so the order page reflects per-item progress.
    # `refunded` stays editable — tick it once the money is actually sent for
    # a cancelled line (there's no live payment gateway to do that for you).
    readonly_fields = ("variant_summary", "status", "line_total")

    # Items are created by checkout only. Without this, Django renders a blank
    # "add another" row whose unsaved OrderItem has unit_price=None, and the
    # line_total readonly field 500s trying to multiply None * quantity.
    def has_add_permission(self, request, obj=None):
        return False

    @admin.display(description="Variant")
    def variant_summary(self, obj):
        return obj.variant_label or "—"


class NeedsRefundFilter(admin.SimpleListFilter):
    """Orders with a cancelled line nobody's refunded yet — the punch list for
    "we cancelled it (couldn't source the size), now go send the money back"."""

    title = "refund"
    parameter_name = "needs_refund"

    def lookups(self, request, model_admin):
        return [("yes", "Needs refund")]

    def queryset(self, request, queryset):
        if self.value() == "yes":
            return queryset.filter(items__status=OrderStatus.CANCELLED, items__refunded=False).distinct()
        return queryset


class ShipmentInline(admin.TabularInline):
    model = Shipment
    extra = 0
    fields = ("label", "status")
    readonly_fields = ("label",)
    show_change_link = True


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "customer", "status_badge", "payment_badge", "total_display", "refund_owed", "item_count", "placed_at")
    list_filter = (PeriodFilter, "status", NeedsRefundFilter)
    date_hierarchy = "placed_at"
    search_fields = ("reference", "user__email", "user__phone", "ship_city")
    # status is rolled up from shipments — edit it on the shipments instead.
    readonly_fields = ("reference", "status", "total", "created_at", "updated_at")
    inlines = [ShipmentInline, OrderItemInline]
    list_per_page = 30
    change_list_template = "admin/orders/order/change_list.html"

    # Orders are created by the app (checkout) only — never added by hand here.
    def has_add_permission(self, request):
        return False

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user").prefetch_related("items", "shipments")

    # ── Analytics dashboard ─────────────────────────────────────────────────
    def get_urls(self):
        custom = [path("analytics/", self.admin_site.admin_view(self.analytics_view), name="orders_order_analytics")]
        return custom + super().get_urls()

    def analytics_view(self, request):
        # get_urls() only wraps this in admin_view (staff-login check) — it
        # doesn't gate on any model permission, so check explicitly.
        if not request.user.has_perm("orders.view_order"):
            raise PermissionDenied
        period = request.GET.get("period", PERIOD_DEFAULT)
        if period not in PERIOD_LABEL:
            period = PERIOD_DEFAULT
        orders = filter_by_period(Order.objects.all(), "placed_at", period)
        # "Paid" = a real payment was captured; exclude cancelled from revenue.
        paid = orders.exclude(payment_brand="").exclude(status=OrderStatus.CANCELLED)
        sold_items = OrderItem.objects.filter(order__in=paid)

        kpis = {
            "orders": orders.count(),
            "paid": paid.count(),
            "pending": orders.filter(status=OrderStatus.PENDING).count(),
            "revenue": paid.aggregate(s=Sum("total"))["s"] or 0,
            "units": sold_items.aggregate(s=Sum("quantity"))["s"] or 0,
        }
        kpis["avg_order"] = (kpis["revenue"] / kpis["paid"]) if kpis["paid"] else 0

        top_products = list(
            sold_items.values("title")
            .annotate(qty=Sum("quantity"), revenue=Sum(F("unit_price") * F("quantity")))
            .order_by("-qty")[:10]
        )
        top_max = max((p["qty"] for p in top_products), default=1)
        for p in top_products:
            p["pct"] = round(p["qty"] / top_max * 100)

        def breakdown(field, labels):
            rows = list(sold_items.values(field).annotate(qty=Sum("quantity")).order_by("-qty"))
            total = sum(r["qty"] for r in rows) or 1
            return [
                {"label": labels.get(r[field], r[field] or "—"), "qty": r["qty"], "pct": round(r["qty"] / total * 100)}
                for r in rows
            ]

        status_rows = []
        for value, count in orders.values_list("status").annotate(c=Count("id")).order_by():
            status_rows.append({"badge": _status_badge(value), "count": count})

        context = {
            **self.admin_site.each_context(request),
            "title": "Order analytics",
            "period": period,
            "period_label": PERIOD_LABEL[period],
            "period_choices": PERIOD_CHOICES,
            "kpis": kpis,
            "top_products": top_products,
            "hub_split": breakdown("warehouse", {"china": "China hub", "zambia": "Lusaka hub"}),
            "carrier_split": breakdown("shipping_method", {"air": "Air", "sea": "Sea", "local": "Local"}),
            "status_rows": status_rows,
        }
        return render(request, "admin/orders/analytics.html", context)

    @admin.display(description="Customer")
    def customer(self, obj):
        return obj.user.email or obj.user.phone or f"user #{obj.user_id}"

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        return _status_badge(obj.status)

    @admin.display(description="Payment")
    def payment_badge(self, obj):
        if obj.payment_brand:
            return format_html(
                '<span class="badge text-bg-success"><i class="fas fa-check me-1"></i>Paid · {}</span>',
                obj.payment_brand,
            )
        return format_html('<span class="badge text-bg-light border text-body-secondary">Unpaid</span>')

    @admin.display(description="Total", ordering="total")
    def total_display(self, obj):
        return _kwacha(obj.total)

    @admin.display(description="Refund owed")
    def refund_owed(self, obj):
        amount = sum(i.line_total for i in obj.items.all() if i.status == OrderStatus.CANCELLED and not i.refunded)
        if not amount:
            return "—"
        return format_html('<span class="badge text-bg-danger">K{} owed</span>', f"{amount:,.2f}")

    @admin.display(description="Items")
    def item_count(self, obj):
        units = sum(i.quantity for i in obj.items.all())
        return format_html('<span class="badge text-bg-light border">{} unit{}</span>', units, "" if units == 1 else "s")

    def save_formset(self, request, form, formset, change):
        """When a shipment's status is edited inline, notify + log + roll up."""
        if formset.model is Shipment:
            for obj in formset.save(commit=False):
                old = Shipment.objects.filter(pk=obj.pk).values_list("status", flat=True).first() if obj.pk else None
                obj.save()
                if old is not None and old != obj.status:
                    obj.items.update(status=obj.status)  # the parcel moves as one unit
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

    list_display = ("order_link", "customer", "carrier_badge", "items_summary", "status_badge", "board_link", "placed_at")
    list_display_links = ("order_link",)
    list_filter = (PeriodFilter, "status", "warehouse", "carrier")
    search_fields = ("order__reference", "order__user__email", "order__user__phone", "items__title")
    date_hierarchy = "placed_at"
    ordering = ("-placed_at",)
    actions = ["mark_sourcing", "mark_transit", "mark_delivered", "mark_cancelled"]
    change_list_template = "admin/orders/shipment/change_list.html"
    list_per_page = 30

    # Shipments are created by the app when an order is placed — not by hand.
    def has_add_permission(self, request):
        return False

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("order", "order__user").prefetch_related("items")

    @admin.display(description="Order", ordering="order__reference")
    def order_link(self, obj):
        url = reverse("admin:orders_order_change", args=[obj.order_id])
        return format_html('<a href="{}"><strong>{}</strong></a>', url, obj.order.reference)

    @admin.display(description="Customer")
    def customer(self, obj):
        return obj.order.user.email or obj.order.user.phone or f"user #{obj.order.user_id}"

    @admin.display(description="Parcel", ordering="carrier")
    def carrier_badge(self, obj):
        icon = _CARRIER_ICON.get(obj.carrier, "fa-box")
        return format_html('<span class="badge text-bg-light border"><i class="fas {} me-1"></i>{}</span>', icon, obj.label)

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        return _status_badge(obj.status)

    @admin.display(description="Items")
    def items_summary(self, obj):
        return ", ".join(f"{i.quantity}× {i.title}" for i in obj.items.all()[:3]) or "—"

    @staticmethod
    def _board_stage(obj):
        """Which Fulfilment-board stage this parcel currently sits in (or None
        if it's done, cancelled or unpaid)."""
        if obj.status in (OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.PENDING):
            return None
        if obj.warehouse == "zambia":
            return "deliver"
        return {OrderStatus.QUEUE: "source", OrderStatus.SOURCED: "ship", OrderStatus.TRANSIT: "arrive"}.get(obj.status)

    @admin.display(description="On board")
    def board_link(self, obj):
        stage = self._board_stage(obj)
        if not stage:
            return format_html('<span class="text-body-secondary">—</span>')
        day = timezone.localdate(obj.placed_at).isoformat()
        url = reverse("admin:orders_shipment_fulfilment_batch", args=[stage, day, obj.carrier])
        return format_html(
            '<a class="badge text-bg-primary" href="{}"><i class="fas fa-clipboard-check me-1"></i>Open batch</a>', url
        )

    # ── Fulfilment board: drill down day → carrier → product ────────────────
    # Each stage filters items by status + hub; the board advances individual
    # product lines (one parcel's shoes can move while its bags wait).
    # icon/color are Bootstrap 5 + FontAwesome tokens used by the board templates.
    STAGES = {
        "source": {
            "title": "To source", "warehouse": "china",
            "statuses": [OrderStatus.QUEUE], "target": OrderStatus.SOURCED,
            "action": "Mark sourced & purchased", "done": "sourced & purchased",
            "hint": "Paid orders waiting to be bought from the China hub.",
            "icon": "fa-cart-shopping", "color": "warning",
        },
        "ship": {
            "title": "To ship", "warehouse": "china",
            "statuses": [OrderStatus.SOURCED], "target": OrderStatus.TRANSIT,
            "action": "Mark shipped (left China)", "done": "shipped",
            "hint": "Sourced & purchased — mark a product shipped once it leaves China.",
            "icon": "fa-plane-departure", "color": "info",
        },
        "arrive": {
            "title": "Arrivals", "warehouse": "china",
            "statuses": [OrderStatus.TRANSIT], "target": OrderStatus.DELIVERED,
            "action": "Mark arrived (ready for collection)", "done": "arrived (ready for collection)",
            "hint": "In transit from China — when it lands, mark each customer's order so they know to collect.",
            "icon": "fa-warehouse", "color": "primary",
            "per_customer": True,  # arrivals are handed over per customer
        },
        "deliver": {
            "title": "Lusaka local", "warehouse": "zambia",
            "statuses": [OrderStatus.QUEUE, OrderStatus.SOURCED, OrderStatus.TRANSIT], "target": OrderStatus.DELIVERED,
            "action": "Mark delivered", "done": "delivered",
            "hint": "Local-stock orders — the rider delivers per customer; mark each drop as it's done.",
            "icon": "fa-truck", "color": "success",
            "per_customer": True,  # the rider works address by address
        },
    }
    CARRIER_LABEL = {"air": "Air", "sea": "Sea", "local": "Local"}
    CARRIER_ICON = {"air": "fa-plane", "sea": "fa-ship", "local": "fa-truck"}

    def get_urls(self):
        v = self.admin_site.admin_view
        custom = [
            path("fulfilment/", v(self.fulfilment_view), name="orders_shipment_fulfilment"),
            path("fulfilment/<slug:stage>/<str:day>/", v(self.fulfilment_day_view), name="orders_shipment_fulfilment_day"),
            path("fulfilment/<slug:stage>/<str:day>/<slug:carrier>/", v(self.fulfilment_batch_view), name="orders_shipment_fulfilment_batch"),
        ]
        return custom + super().get_urls()

    def _stage_items(self, stage, *, day=None, carrier=None):
        cfg = self.STAGES[stage]
        qs = (
            OrderItem.objects.filter(status__in=cfg["statuses"], warehouse=cfg["warehouse"])
            .select_related("order", "shipment", "order__user")
        )
        if day is not None:
            qs = qs.filter(order__placed_at__date=day)
        if carrier is not None:
            qs = qs.filter(shipping_method=carrier)
        return qs

    @staticmethod
    def _line_key(item) -> str:
        """Identifies a product line within a batch — distinct variants split."""
        return f"{item.product_id or 0}|{item.variant_label}"

    def _board_redirect(self, request, msg):
        self.message_user(request, msg, level=messages.ERROR)
        return redirect("admin:orders_shipment_fulfilment")

    # Level 1 — the day list per stage.
    def fulfilment_view(self, request):
        if not request.user.has_perm("orders.view_shipment"):
            raise PermissionDenied
        sections = []
        for key, cfg in self.STAGES.items():
            days: dict = {}
            for it in self._stage_items(key):
                day = timezone.localdate(it.order.placed_at)
                d = days.setdefault(day, {"day": day, "total": 0, "carriers": {}, "lines": set()})
                d["total"] += it.quantity
                d["carriers"][it.shipping_method] = d["carriers"].get(it.shipping_method, 0) + it.quantity
                d["lines"].add(self._line_key(it))
            day_list = []
            for day in sorted(days, reverse=True):
                d = days[day]
                day_list.append({
                    "day": day, "total": d["total"], "products": len(d["lines"]),
                    "carriers": [
                        {"label": self.CARRIER_LABEL.get(c, c), "icon": self.CARRIER_ICON.get(c, "fa-box"), "qty": q}
                        for c, q in sorted(d["carriers"].items())
                    ],
                    "url": reverse("admin:orders_shipment_fulfilment_day", args=[key, day.isoformat()]),
                })
            sections.append({
                "key": key, "title": cfg["title"], "hint": cfg["hint"],
                "icon": cfg["icon"], "color": cfg["color"],
                "units": sum(d["total"] for d in day_list), "days": day_list,
            })
        context = {**self.admin_site.each_context(request), "title": "Fulfilment board", "sections": sections}
        return render(request, "admin/orders/fulfilment.html", context)

    # Level 2 — the carriers within one day of a stage.
    def fulfilment_day_view(self, request, stage, day):
        if not request.user.has_perm("orders.view_shipment"):
            raise PermissionDenied
        if stage not in self.STAGES:
            return self._board_redirect(request, "Unknown stage.")
        try:
            day_d = date.fromisoformat(day)
        except ValueError:
            return self._board_redirect(request, "Invalid day.")
        cfg = self.STAGES[stage]
        carriers: dict = {}
        for it in self._stage_items(stage, day=day_d):
            c = carriers.setdefault(it.shipping_method, {"qty": 0, "lines": set()})
            c["qty"] += it.quantity
            c["lines"].add(self._line_key(it))
        carrier_list = [
            {
                "label": self.CARRIER_LABEL.get(c, c), "icon": self.CARRIER_ICON.get(c, "fa-box"),
                "qty": info["qty"], "products": len(info["lines"]),
                "url": reverse("admin:orders_shipment_fulfilment_batch", args=[stage, day, c]),
            }
            for c, info in sorted(carriers.items())
        ]
        context = {
            **self.admin_site.each_context(request),
            "title": f"{cfg['title']} · {day_d}",
            "stage_title": cfg["title"], "stage_icon": cfg["icon"], "stage_color": cfg["color"],
            "day": day_d, "carriers": carrier_list,
            "back_url": reverse("admin:orders_shipment_fulfilment"),
        }
        return render(request, "admin/orders/fulfilment_day.html", context)

    # Level 3 — the product lines within one day+carrier; advance them here.
    def fulfilment_batch_view(self, request, stage, day, carrier):
        if not request.user.has_perm("orders.view_shipment"):
            raise PermissionDenied
        if stage not in self.STAGES:
            return self._board_redirect(request, "Unknown stage.")
        try:
            day_d = date.fromisoformat(day)
        except ValueError:
            return self._board_redirect(request, "Invalid day.")
        if request.method == "POST":
            if not request.user.has_perm("orders.change_shipment"):
                raise PermissionDenied
            return self._advance(request, stage, day_d, carrier)

        cfg = self.STAGES[stage]
        stage_items = list(self._stage_items(stage, day=day_d, carrier=carrier))

        # Product-grouped buy list (source/ship stages).
        index: dict = {}
        lines: list = []
        all_orders: set = set()
        for it in stage_items:
            key = self._line_key(it)
            line = index.get(key)
            if line is None:
                url = reverse("admin:products_product_change", args=[it.product_id]) if it.product_id else ""
                line = {"key": key, "title": it.title, "image": it.image, "url": url,
                        "variant": it.variant_label, "qty": 0, "customers": set()}
                index[key] = line
                lines.append(line)
            line["qty"] += it.quantity
            line["customers"].add(it.order_id)
            all_orders.add(it.order_id)
        for line in lines:
            line["customers"] = len(line["customers"])
        lines.sort(key=lambda r: (-r["qty"], r["title"]))

        # Customer-grouped drop list (arrive/deliver stages): the rider or the
        # collection desk works order by order — show who, where, and what.
        customer_orders: list = []
        if cfg.get("per_customer"):
            by_order: dict = {}
            for it in stage_items:
                o = by_order.get(it.order_id)
                if o is None:
                    order = it.order
                    contact = order.user.email or order.user.phone or ""
                    o = {
                        "id": order.pk,
                        "ref": order.reference,
                        "name": order.ship_name or order.user.full_name or contact or f"user #{order.user_id}",
                        "initial": (order.ship_name or order.user.full_name or contact or "?")[:1].upper(),
                        "phone": order.ship_phone or order.user.phone or "",
                        "contact": contact,
                        "address": ", ".join(p for p in [order.ship_line1, order.ship_city, order.ship_area] if p),
                        "items": [], "units": 0, "value": 0,
                    }
                    by_order[it.order_id] = o
                    customer_orders.append(o)
                o["items"].append({"title": it.title, "image": it.image, "variant": it.variant_label, "qty": it.quantity})
                o["units"] += it.quantity
                o["value"] += float(it.line_total)
            customer_orders.sort(key=lambda r: r["ref"])

        context = {
            **self.admin_site.each_context(request),
            "title": f"{cfg['title']} · {day_d} · {self.CARRIER_LABEL.get(carrier, carrier)}",
            "stage": stage,
            "stage_title": cfg["title"], "stage_icon": cfg["icon"], "stage_color": cfg["color"],
            "day": day_d,
            "carrier_label": self.CARRIER_LABEL.get(carrier, carrier),
            "carrier_icon": self.CARRIER_ICON.get(carrier, "fa-box"),
            "action_label": cfg["action"], "lines": lines,
            "customer_orders": customer_orders,
            "per_customer": bool(cfg.get("per_customer")),
            "total": sum(line["qty"] for line in lines),
            "customers_total": len(all_orders),
            "back_url": reverse("admin:orders_shipment_fulfilment_day", args=[stage, day]),
        }
        return render(request, "admin/orders/fulfilment_batch.html", context)

    def _advance(self, request, stage, day, carrier):
        cfg = self.STAGES[stage]
        base = list(self._stage_items(stage, day=day, carrier=carrier))
        order_id = request.POST.get("order", "")
        line_key = request.POST.get("line", "")
        if order_id:  # one customer's whole order (the rider finished a drop)
            items = [it for it in base if str(it.order_id) == order_id]
        elif line_key and line_key != "__all__":  # one product line
            items = [it for it in base if self._line_key(it) == line_key]
        else:  # the whole batch
            items = base
        if not items:
            self.message_user(request, "Nothing to update — it may have already moved.", level=messages.WARNING)
            return redirect(request.path)

        # "Couldn't source" — sourcing stage only, and only ever one product+
        # variant line at a time (never a whole order or the whole batch): a
        # bad size shouldn't take a customer's other items down with it.
        if request.POST.get("item_action") == "unavailable":
            if stage != "source" or order_id or not line_key or line_key == "__all__":
                raise PermissionDenied
            customers, units = cancel_unavailable_items(items)
            self.message_user(
                request,
                f"Cancelled {units} unit(s) of {items[0].title} ({items[0].variant_label}) — "
                f"{customers} customer(s) notified and flagged to refund.",
                level=messages.WARNING,
            )
            return redirect(request.path)

        customers, units = advance_items(items, cfg["target"])
        if order_id:
            self.message_user(request, f"Order {items[0].order.reference} marked {cfg['done']} — the customer has been notified.")
        else:
            self.message_user(request, f"Marked {units} unit(s) as {cfg['done']} — {customers} customer(s) notified.")
        return redirect(request.path)

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
        self._bulk(request, queryset, OrderStatus.SOURCED)

    @admin.action(description="Mark Shipped (→ In transit)")
    def mark_transit(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.TRANSIT)

    @admin.action(description="Mark Delivered")
    def mark_delivered(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.DELIVERED)

    @admin.action(description="Mark Cancelled")
    def mark_cancelled(self, request, queryset):
        self._bulk(request, queryset, OrderStatus.CANCELLED)
