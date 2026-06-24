from django.shortcuts import get_object_or_404
from rest_framework import status as http_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from products.models import Product
from .models import Carrier, Order, OrderItem, OrderStatus
from .serializers import OrderSerializer

# Reverse of BUCKET_BY_STATUS: a tab maps to the statuses it contains.
BUCKET_STATUSES = {
    "pending": [OrderStatus.PENDING],
    "queue": [OrderStatus.QUEUE, OrderStatus.SOURCING],
    "transit": [OrderStatus.TRANSIT],
    "delivered": [OrderStatus.DELIVERED],
    "cancelled": [OrderStatus.CANCELLED],
}


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def orders(request):
    """GET: the current user's orders (optionally ?bucket= or ?status=).
    POST: create an order from the checkout payload."""
    if request.method == "POST":
        return _create_order(request)

    qs = request.user.orders.prefetch_related("items", "events")
    bucket = request.query_params.get("bucket")
    if bucket in BUCKET_STATUSES:
        qs = qs.filter(status__in=BUCKET_STATUSES[bucket])
    if status_param := request.query_params.get("status"):
        qs = qs.filter(status=status_param)
    return Response(OrderSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, reference):
    order = get_object_or_404(request.user.orders.prefetch_related("items", "events"), reference=reference)
    return Response(OrderSerializer(order).data)


def _create_order(request):
    data = request.data
    items = data.get("items") or []
    if not items:
        return Response({"detail": "Your cart is empty."}, status=http_status.HTTP_400_BAD_REQUEST)

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
    )

    slugs = [it.get("slug") for it in items if isinstance(it, dict) and it.get("slug")]
    products_by_slug = {p.slug: p for p in Product.objects.filter(slug__in=slugs)} if slugs else {}

    for it in items:
        if not isinstance(it, dict):
            continue
        try:
            qty = max(1, int(it.get("quantity") or 1))
        except (TypeError, ValueError):
            continue

        product = products_by_slug.get(it.get("slug"))
        if product is not None:
            # SERVER-AUTHORITATIVE: never trust client-sent price/title for a known
            # product — a tampered payload can't change what the order really costs.
            title = product.title
            image = product.image
            warehouse = product.warehouse or ""
            unit_price = product.price
        else:
            # Unknown product (mock/legacy item) — fall back to the client snapshot.
            try:
                unit_price = float(it.get("price") or 0)
            except (TypeError, ValueError):
                continue
            title = str(it.get("title") or "Item")[:200]
            image = str(it.get("image") or "")[:2048]
            warehouse = str(it.get("warehouse") or "")[:10]

        OrderItem.objects.create(
            order=order,
            product=product,
            title=title,
            image=image,
            warehouse=warehouse,
            unit_price=unit_price,
            quantity=qty,
        )

    order.recalculate_total()
    # Timeline events: the order was placed, and (if paid) immediately queued.
    order.log_event(OrderStatus.PENDING, at=order.placed_at)
    if order.status != OrderStatus.PENDING:
        order.log_event(order.status, at=order.placed_at)
    order._notify_status_change()  # post the initial order update to the inbox
    return Response(OrderSerializer(order).data, status=http_status.HTTP_201_CREATED)
