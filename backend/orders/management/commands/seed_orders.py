"""Seed a spread of demo orders (one per status) for users who have none, so the
account "My Orders" tabs show realistic data. Items are drawn from real seeded
products. Idempotent: only seeds users with zero existing orders.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from orders.models import Carrier, Order, OrderItem, OrderStatus
from products.models import Product

User = get_user_model()

# (status, carrier, days_ago, number_of_items)
PLAN = [
    (OrderStatus.PENDING, "", 1, 1),
    (OrderStatus.QUEUE, Carrier.AIR, 4, 2),
    (OrderStatus.SOURCING, Carrier.SEA, 9, 1),
    (OrderStatus.TRANSIT, Carrier.AIR, 16, 1),
    (OrderStatus.DELIVERED, Carrier.SEA, 30, 2),
]


class Command(BaseCommand):
    help = "Seed demo orders for users that have none."

    def handle(self, *args, **options):
        catalogue = list(Product.objects.filter(is_active=True).order_by("id"))
        if not catalogue:
            self.stdout.write(self.style.WARNING("No products found — run seed_products / seed_car_catalog first."))
            return

        seeded_orders = 0
        seeded_users = 0
        for user in User.objects.filter(is_active=True):
            if user.orders.exists():
                continue
            seeded_users += 1
            for idx, (status, carrier, days_ago, n_items) in enumerate(PLAN):
                order = Order.objects.create(
                    user=user,
                    status=status,
                    carrier=carrier,
                    ship_name=user.full_name or "",
                    ship_line1=user.address_line1 or "Plot 123, Great East Rd",
                    ship_city=user.address_city or "Lusaka",
                    ship_area=user.address_area or "",
                    ship_phone=user.phone or "",
                    payment_brand="" if status == OrderStatus.PENDING else "airtel",
                    payment_detail="" if status == OrderStatus.PENDING else "••• 210",
                    placed_at=timezone.now() - timedelta(days=days_ago),
                )
                # Pick a rotating window of products for this order's items.
                start = (idx * 2) % len(catalogue)
                chosen = [catalogue[(start + j) % len(catalogue)] for j in range(n_items)]
                for j, product in enumerate(chosen):
                    wh = product.warehouse or "china"
                    if wh != "china":
                        method, price = "local", product.price
                    elif product.air_price is not None and j % 2 == 1:
                        method, price = "air", product.air_price  # mix in some air
                    else:
                        method, price = "sea", product.price
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        title=product.title,
                        image=product.image,
                        warehouse=wh,
                        shipping_method=method,
                        unit_price=price,
                        quantity=1,
                    )
                order.recalculate_total()
                seeded_orders += 1

        # Backfill tracking events for any order that has none (incl. legacy ones),
        # spreading them realistically between placed_at and now.
        backfilled = self._backfill_events()

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {seeded_orders} orders for {seeded_users} user(s); "
                f"backfilled events for {backfilled} order(s)."
            )
        )

    def _backfill_events(self) -> int:
        # The progression order, by status, up to a given order's current status.
        STAGES = [
            OrderStatus.PENDING,
            OrderStatus.QUEUE,
            OrderStatus.SOURCING,
            OrderStatus.TRANSIT,
            OrderStatus.DELIVERED,
        ]
        now = timezone.now()
        count = 0
        for order in Order.objects.filter(events__isnull=True).distinct():
            if order.status == OrderStatus.CANCELLED:
                order.log_event(OrderStatus.PENDING, at=order.placed_at)
                order.log_event(OrderStatus.CANCELLED, at=order.placed_at + timedelta(days=1))
                count += 1
                continue
            ci = STAGES.index(order.status) if order.status in STAGES else 0
            span = now - order.placed_at
            for j in range(ci + 1):
                at = order.placed_at + (span * (j / ci) if ci else span * 0)
                order.log_event(STAGES[j], at=at)
            count += 1
        return count
