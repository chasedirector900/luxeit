"""Fulfilment-board logic: advance individual order items (a product within a
day+carrier batch) and notify each affected customer per product. Shipment and
order statuses roll up from the items afterwards.
"""
from collections import defaultdict

from .models import OrderStatus


def _notify_items(order, items, status) -> None:
    """One inbox message to the customer about the product(s) that just moved."""
    from messaging.models import ThreadKind
    from messaging.services import post_message, wants_notification

    if not wants_notification(order.user, "order_updates"):
        return
    ref = order.reference
    names = ", ".join(dict.fromkeys(it.title for it in items))  # unique, order-kept
    warehouse = items[0].warehouse

    if status == OrderStatus.SOURCED:
        body = f"Good news — we've sourced & purchased your {names} (order {ref}). It's being prepared for shipping."
    elif status == OrderStatus.TRANSIT:
        body = (
            f"Your {names} (order {ref}) has shipped and left the China hub — it's on its way."
            if warehouse == "china"
            else f"Your {names} (order {ref}) is on its way."
        )
    elif status == OrderStatus.DELIVERED:
        body = (
            f"Your {names} (order {ref}) has arrived and is ready for collection."
            if warehouse == "china"
            else f"Your {names} (order {ref}) has been delivered. Enjoy!"
        )
    elif status == OrderStatus.CANCELLED:
        body = f"Your {names} (order {ref}) was cancelled."
    else:
        body = f"Update on your {names} (order {ref})."

    post_message(
        user=order.user, kind=ThreadKind.ORDER,
        slug=f"order-{ref.lower()}", name=f"Order {ref}", body=body,
    )


def advance_items(items, target) -> tuple[int, int]:
    """Move every item in `items` to `target`, roll up the affected shipments and
    orders, and notify each customer once about their product(s). The caller
    passes items already select_related on order/order__user/shipment. Returns
    (customers_notified, units_advanced)."""
    items = list(items)
    by_order: dict = defaultdict(list)
    orders: dict = {}
    for it in items:
        by_order[it.order_id].append(it)
        orders[it.order_id] = it.order

    customers = units = 0
    for oid, its in by_order.items():
        changed = []
        shipments = {}
        for it in its:
            shipments[it.shipment_id] = it.shipment
            if it.status != target:
                it.status = target
                it.save(update_fields=["status"])
                units += it.quantity
                changed.append(it)
        for sh in shipments.values():
            sh.recalculate_status()  # rolls the order up too
        if changed:
            _notify_items(orders[oid], changed, target)
            customers += 1
    return customers, units


def _notify_unavailable(order, items) -> None:
    """Distinct from `_notify_items`'s generic cancellation notice: this names
    the product/variant and the refund amount, since the customer needs to
    know *why* (the supplier didn't have their size) and what to expect."""
    from messaging.models import ThreadKind
    from messaging.services import post_message, wants_notification

    if not wants_notification(order.user, "order_updates"):
        return
    ref = order.reference
    refund = sum(it.line_total for it in items)
    names = ", ".join(dict.fromkeys(
        (f"{it.title} ({it.variant_label})" if it.variant_label else it.title) for it in items
    ))
    body = (
        f"Sorry — we couldn't source {names} for order {ref} (out of stock at the supplier). "
        f"You're being refunded K{refund:,.2f}; our team will process it shortly."
    )
    post_message(
        user=order.user, kind=ThreadKind.ORDER,
        slug=f"order-{ref.lower()}", name=f"Order {ref}", body=body,
    )


def cancel_unavailable_items(items) -> tuple[int, int]:
    """Cancel items a supplier couldn't actually source (e.g. a sold-out shoe
    size discovered while buying) and keep each order's total in sync. Marks
    them `refunded=False` — the money still moves manually until a payment
    gateway is wired up; this is what flags that it's owed.
    Returns (customers_notified, units_cancelled)."""
    items = list(items)
    by_order: dict = defaultdict(list)
    orders: dict = {}
    for it in items:
        by_order[it.order_id].append(it)
        orders[it.order_id] = it.order

    customers = units = 0
    for oid, its in by_order.items():
        changed = []
        shipments = {}
        for it in its:
            shipments[it.shipment_id] = it.shipment
            if it.status != OrderStatus.CANCELLED:
                it.status = OrderStatus.CANCELLED
                it.refunded = False
                it.save(update_fields=["status", "refunded"])
                units += it.quantity
                changed.append(it)
        for sh in shipments.values():
            sh.recalculate_status()
        order = orders[oid]
        order.recalculate_total()
        if changed:
            _notify_unavailable(order, changed)
            customers += 1
    return customers, units
