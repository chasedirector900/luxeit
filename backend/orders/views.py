from django.db import IntegrityError
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import status as http_status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.throttling import OrderCreateThrottle

from products.models import Product
from .models import Carrier, ItemCarrier, Order, OrderItem, OrderStatus, Shipment
from .serializers import OrderSerializer

# Reused prefetches: load items (with product+category for review links) and
# shipments (with their own items + events) without N+1 queries.
_ITEMS_QS = OrderItem.objects.select_related("product__category")
_ITEMS_PREFETCH = Prefetch("items", queryset=_ITEMS_QS)
_SHIPMENTS_PREFETCH = Prefetch(
    "shipments",
    queryset=Shipment.objects.prefetch_related(Prefetch("items", queryset=_ITEMS_QS), "events"),
)
_ORDER_PREFETCH = (_ITEMS_PREFETCH, _SHIPMENTS_PREFETCH)

# Reverse of BUCKET_BY_STATUS: a tab maps to the statuses it contains.
BUCKET_STATUSES = {
    "pending": [OrderStatus.PENDING],
    "queue": [OrderStatus.QUEUE, OrderStatus.SOURCED],
    "transit": [OrderStatus.TRANSIT],
    "delivered": [OrderStatus.DELIVERED],
    "cancelled": [OrderStatus.CANCELLED],
}


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([OrderCreateThrottle])  # write-only: GETs are never counted
def orders(request):
    """GET: the current user's orders (optionally ?bucket= or ?status=).
    POST: create an order from the checkout payload."""
    if request.method == "POST":
        return _create_order(request)

    qs = request.user.orders.prefetch_related(*_ORDER_PREFETCH)
    bucket = request.query_params.get("bucket")
    if bucket in BUCKET_STATUSES:
        qs = qs.filter(status__in=BUCKET_STATUSES[bucket])
    if status_param := request.query_params.get("status"):
        qs = qs.filter(status=status_param)
    return Response(OrderSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, reference):
    order = get_object_or_404(request.user.orders.prefetch_related(*_ORDER_PREFETCH), reference=reference)
    return Response(OrderSerializer(order).data)


def _clean_variant(raw) -> dict:
    """Sanitise the customer's selected options into a {label: value} snapshot:
    strings only, trimmed, length-capped, at most a handful of attributes."""
    if not isinstance(raw, dict):
        return {}
    out: dict = {}
    for key, value in list(raw.items())[:12]:
        label = str(key)[:40].strip()
        val = str(value)[:80].strip()
        if label and val:
            out[label] = val
    return out


def _create_order(request):
    data = request.data
    items = data.get("items") or []
    if not items:
        return Response({"detail": "Your cart is empty."}, status=http_status.HTTP_400_BAD_REQUEST)

    # Duplicate-submit shield: if this exact checkout attempt was already
    # processed (double-tap, retry after a network blip), return the order that
    # was created then — never a second order.
    idem_key = str(data.get("idempotencyKey") or "").strip()[:64]
    if idem_key:
        existing = (
            request.user.orders.filter(idempotency_key=idem_key)
            .prefetch_related(*_ORDER_PREFETCH)
            .first()
        )
        if existing is not None:
            return Response(OrderSerializer(existing).data, status=http_status.HTTP_200_OK)

    user = request.user
    address = data.get("address") or {}
    # Fall back to the saved profile address when checkout didn't pass one.
    line1 = str(address.get("line1") or user.address_line1 or "").strip()
    city = str(address.get("city") or user.address_city or "").strip()
    area = str(address.get("area") or user.address_area or "").strip()
    if not (line1 or city):
        return Response({"detail": "A delivery address is required."}, status=http_status.HTTP_400_BAD_REQUEST)

    payment = data.get("payment") or {}
    carrier = data.get("carrier") or ""
    if carrier not in Carrier.values:
        carrier = ""

    # A chosen payment method means it's paid -> queue; otherwise awaiting payment.
    new_status = OrderStatus.QUEUE if payment.get("brand") else OrderStatus.PENDING

    try:
        order = Order.objects.create(
            user=user,
            status=new_status,
            carrier=carrier,
            ship_name=user.full_name or "",
            ship_line1=line1,
            ship_city=city,
            ship_area=area,
            ship_phone=user.phone or "",
            payment_brand=str(payment.get("brand") or "")[:20],
            payment_detail=str(payment.get("detail") or "")[:40],
            idempotency_key=idem_key,
        )
    except IntegrityError:
        # Two identical submits raced — the other one won; return its order.
        existing = request.user.orders.filter(idempotency_key=idem_key).prefetch_related(*_ORDER_PREFETCH).first()
        if existing is not None:
            return Response(OrderSerializer(existing).data, status=http_status.HTTP_200_OK)
        raise

    slugs = [it.get("slug") for it in items if isinstance(it, dict) and it.get("slug")]
    products_by_slug = {p.slug: p for p in Product.objects.filter(slug__in=slugs)} if slugs else {}

    # Resolve every line server-authoritatively, then group into shipments by
    # (hub, carrier). One order/payment, possibly several parcels.
    groups: dict = {}
    group_order: list = []
    for it in items:
        if not isinstance(it, dict):
            continue
        try:
            qty = max(1, int(it.get("quantity") or 1))
        except (TypeError, ValueError):
            continue

        requested = str(it.get("shippingMethod") or carrier or "").lower()
        product = products_by_slug.get(it.get("slug"))

        if product is not None:
            title = product.title
            image = product.image_url
            warehouse = product.warehouse or "china"
        else:
            title = str(it.get("title") or "Item")[:200]
            image = str(it.get("image") or "")[:2048]
            warehouse = str(it.get("warehouse") or "china")[:10]

        # Zambia is always local; China can only go air if the product offers it.
        if warehouse != "china":
            method = ItemCarrier.LOCAL
        elif requested == "air" and (product is None or product.has_dual_shipping):
            method = ItemCarrier.AIR
        else:
            method = ItemCarrier.SEA

        if product is not None:
            unit_price = product.air_price if (method == ItemCarrier.AIR and product.has_dual_shipping) else product.price
        else:
            try:
                unit_price = float(it.get("price") or 0)
            except (TypeError, ValueError):
                continue

        variant = _clean_variant(it.get("selectedOptions") or it.get("variant"))

        key = (warehouse, method)
        if key not in groups:
            groups[key] = []
            group_order.append(key)
        groups[key].append(
            {"product": product, "title": title, "image": image, "warehouse": warehouse,
             "method": method, "variant": variant, "unit_price": unit_price, "quantity": qty}
        )

    if not group_order:
        order.delete()
        return Response({"detail": "Your cart is empty."}, status=http_status.HTTP_400_BAD_REQUEST)

    for key in group_order:
        warehouse, method = key
        shipment = Shipment.objects.create(
            order=order, warehouse=warehouse, carrier=method, status=new_status, placed_at=order.placed_at,
        )
        for spec in groups[key]:
            OrderItem.objects.create(
                order=order,
                shipment=shipment,
                product=spec["product"],
                title=spec["title"],
                image=spec["image"],
                warehouse=spec["warehouse"],
                shipping_method=spec["method"],
                variant=spec["variant"],
                status=new_status,  # item-level truth; shipment/order roll up from it
                unit_price=spec["unit_price"],
                quantity=spec["quantity"],
            )
        # Per-shipment timeline: placed (pending), then queued if already paid.
        shipment.log_event(OrderStatus.PENDING, at=order.placed_at)
        if new_status != OrderStatus.PENDING:
            shipment.log_event(new_status, at=order.placed_at)

    order.recalculate_total()
    order.recalculate_status()
    _notify_order_placed(order)
    return Response(OrderSerializer(order).data, status=http_status.HTTP_201_CREATED)


def _notify_order_placed(order):
    """A single inbox confirmation when an order is placed (per-shipment updates
    come later as each parcel advances)."""
    from messaging.services import post_message, wants_notification
    from messaging.models import ThreadKind

    if not wants_notification(order.user, "order_updates"):
        return
    ref = order.reference
    n = order.shipments.count()
    parcels = "1 shipment" if n == 1 else f"{n} shipments"
    tail = (
        "We've received payment and queued it to be sourced."
        if order.status != OrderStatus.PENDING
        else "It's awaiting payment."
    )
    post_message(
        user=order.user,
        kind=ThreadKind.ORDER,
        slug=f"order-{ref.lower()}",
        name=f"Order {ref}",
        body=f"Order {ref} placed — shipping in {parcels}. {tail}",
    )
