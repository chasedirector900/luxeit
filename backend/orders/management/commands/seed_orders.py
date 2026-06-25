"""Seed demo orders with per-shipment tracking for users who have none, so the
account "My Orders" tabs + tracking timelines show realistic data — including an
order whose China-air parcel is delivered while its China-sea parcel is still in
transit. Idempotent: only seeds users with zero existing orders.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from orders.models import Order, OrderItem, OrderStatus, Shipment
from products.models import Product

User = get_user_model()

STAGES = [OrderStatus.PENDING, OrderStatus.QUEUE, OrderStatus.SOURCING, OrderStatus.TRANSIT, OrderStatus.DELIVERED]

# Each order: (days_ago, paid, [ (warehouse, carrier, status, n_items), ... ]).
PLAN = [
    (1, False, [("china", "sea", OrderStatus.PENDING, 1)]),
    (4, True, [("china", "sea", OrderStatus.QUEUE, 1)]),
    (9, True, [("china", "sea", OrderStatus.SOURCING, 2)]),
    (16, True, [("china", "air", OrderStatus.TRANSIT, 1)]),
    # Premium showcase: one order, two parcels at different stages.
    (30, True, [("china", "air", OrderStatus.DELIVERED, 1), ("china", "sea", OrderStatus.TRANSIT, 1)]),
    (44, True, [("zambia", "local", OrderStatus.DELIVERED, 1)]),
]


class Command(BaseCommand):
    help = "Seed demo orders (with per-shipment tracking) for users that have none."

    def handle(self, *args, **options):
        china_air = list(Product.objects.filter(is_active=True, warehouse="china", air_price__isnull=False).order_by("id"))
        china_any = list(Product.objects.filter(is_active=True, warehouse="china").order_by("id"))
        zambia = list(Product.objects.filter(is_active=True, warehouse="zambia").order_by("id"))
        if not china_any:
            self.stdout.write(self.style.WARNING("No products — run seed_products / seed_car_catalog first."))
            return

        def pick(warehouse, carrier, n, offset):
            pool = zambia if warehouse == "zambia" else (china_air if carrier == "air" else china_any)
            pool = pool or china_any
            return [pool[(offset + i) % len(pool)] for i in range(n)]

        now = timezone.now()
        seeded_orders = seeded_users = 0
        for user in User.objects.filter(is_active=True):
            if user.orders.exists():
                continue
            seeded_users += 1
            for oi, (days_ago, paid, shipment_specs) in enumerate(PLAN):
                placed = now - timedelta(days=days_ago)
                order = Order.objects.create(
                    user=user,
                    status=OrderStatus.PENDING,
                    ship_name=user.full_name or "",
                    ship_line1=user.address_line1 or "Plot 123, Great East Rd",
                    ship_city=user.address_city or "Lusaka",
                    ship_area=user.address_area or "",
                    ship_phone=user.phone or "",
                    payment_brand="" if not paid else "airtel",
                    payment_detail="" if not paid else "••• 210",
                    placed_at=placed,
                )
                for si, (warehouse, carrier, status, n_items) in enumerate(shipment_specs):
                    shipment = Shipment.objects.create(
                        order=order, warehouse=warehouse, carrier=carrier, status=status, placed_at=placed,
                    )
                    for product in pick(warehouse, carrier, n_items, oi * 2 + si):
                        price = product.air_price if (carrier == "air" and product.air_price is not None) else product.price
                        OrderItem.objects.create(
                            order=order, shipment=shipment, product=product,
                            title=product.title, image=product.image, warehouse=warehouse,
                            shipping_method=carrier, unit_price=price, quantity=1,
                        )
                    # Backfill this shipment's timeline up to its current status.
                    ci = STAGES.index(status) if status in STAGES else 0
                    span = now - placed
                    for j in range(ci + 1):
                        at = placed + (span * (j / ci) if ci else span * 0)
                        shipment.events.create(status=STAGES[j], created_at=at)

                order.recalculate_total()
                order.recalculate_status()
                seeded_orders += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {seeded_orders} orders for {seeded_users} user(s)."))
