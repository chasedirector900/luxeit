"""Serializers emitting the frontend Order shape (see lib/orders/mock-orders.ts).
Order.id is the human reference; placedOn is a preformatted label.
"""
from django.utils import timezone
from rest_framework import serializers

from .models import Order, OrderItem, OrderStatus


def _placed_label(dt) -> str:
    # Cross-platform "Jun 11, 2026" (avoids %-d, which Windows rejects).
    return f"{dt.strftime('%b')} {dt.day}, {dt.year}"


def _event_label(dt) -> str:
    # Compact "Jun 9" for the tracking timeline.
    local = timezone.localtime(dt)
    return f"{local.strftime('%b')} {local.day}"


def _item_dict(item: OrderItem, *, reviewable: bool = False) -> dict:
    data = {
        "title": item.title,
        "image": item.image,
        "quantity": item.quantity,
        "price": float(item.unit_price),
    }
    # Linked catalogue product -> let the app deep-link to its review page.
    if item.product_id:
        data["slug"] = item.product.slug
        if item.product.category_id:
            data["categorySlug"] = item.product.category.slug
        data["reviewable"] = reviewable
    return data


class OrderSerializer(serializers.BaseSerializer):
    def to_representation(self, order: Order) -> dict:
        data = {
            "id": order.reference,
            "placedOn": _placed_label(order.placed_at),
            "status": order.status,
            "bucket": order.bucket,
            "statusLabel": order.status_label,
            "statusDescription": order.status_description,
            "total": float(order.total),
            "items": [_item_dict(i, reviewable=order.status == OrderStatus.DELIVERED) for i in order.items.all()],
            # Per-step timestamps for the tracking timeline.
            "events": [{"status": e.status, "at": _event_label(e.created_at)} for e in order.events.all()],
        }
        if order.carrier:
            data["carrier"] = order.carrier
        address = ", ".join(p for p in [order.ship_line1, order.ship_city, order.ship_area] if p)
        if address:
            data["shippingAddress"] = address
        if order.payment_brand:
            data["payment"] = {"brand": order.payment_brand, "detail": order.payment_detail}
        return data
