from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from .models import Order, OrderItem, OrderStatus, Shipment

User = get_user_model()


class OrderModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="buyer@example.com")

    def _shipment(self, order, warehouse="china", carrier="sea", status=OrderStatus.QUEUE):
        return Shipment.objects.create(order=order, warehouse=warehouse, carrier=carrier, status=status)

    def test_reference_is_generated(self):
        order = Order.objects.create(user=self.user)
        self.assertTrue(order.reference.startswith("LX-"))

    def test_total_recalculates_from_items(self):
        order = Order.objects.create(user=self.user)
        OrderItem.objects.create(order=order, title="A", unit_price=10, quantity=2)
        OrderItem.objects.create(order=order, title="B", unit_price=5, quantity=1)
        order.recalculate_total()
        self.assertEqual(float(order.total), 25.0)

    def test_bucket_mapping(self):
        order = Order.objects.create(user=self.user, status=OrderStatus.SOURCED)
        self.assertEqual(order.bucket, "queue")

    def test_shipment_set_status_posts_inbox_update(self):
        order = Order.objects.create(user=self.user)
        sh = self._shipment(order, status=OrderStatus.QUEUE)
        sh.set_status(OrderStatus.TRANSIT)
        self.assertEqual(sh.status, OrderStatus.TRANSIT)
        thread = self.user.threads.get(slug=f"order-{order.reference.lower()}")
        self.assertTrue(thread.messages.filter(body__icontains="on its way").exists())

    def test_shipment_set_status_logs_a_timeline_event(self):
        order = Order.objects.create(user=self.user)
        sh = self._shipment(order, status=OrderStatus.QUEUE)
        sh.set_status(OrderStatus.SOURCED)
        self.assertTrue(sh.events.filter(status=OrderStatus.SOURCED).exists())

    def test_order_status_rolls_up_to_least_advanced_shipment(self):
        order = Order.objects.create(user=self.user)
        self._shipment(order, carrier="air", status=OrderStatus.DELIVERED)
        sea = self._shipment(order, carrier="sea", status=OrderStatus.QUEUE)
        order.recalculate_status()
        self.assertEqual(order.status, OrderStatus.QUEUE)  # not "delivered" until all are
        sea.set_status(OrderStatus.DELIVERED)
        self.assertEqual(Order.objects.get(pk=order.pk).status, OrderStatus.DELIVERED)

    def test_order_updates_preference_is_honored(self):
        from users.models import NotificationPreferences

        NotificationPreferences.objects.update_or_create(user=self.user, defaults={"order_updates": False})
        order = Order.objects.create(user=self.user)
        sh = self._shipment(order, status=OrderStatus.QUEUE)
        sh.set_status(OrderStatus.TRANSIT)
        # No inbox message posted...
        self.assertFalse(self.user.threads.filter(slug=f"order-{order.reference.lower()}").exists())
        # ...but the timeline event is still recorded (data, not a notification).
        self.assertTrue(sh.events.filter(status=OrderStatus.TRANSIT).exists())


class ItemLevelFulfilmentTests(TestCase):
    """The board advances individual products; shipment + order roll up from items."""

    def setUp(self):
        self.user = User.objects.create_user(email="buyer2@example.com")
        self.order = Order.objects.create(user=self.user)
        self.sh = Shipment.objects.create(
            order=self.order, warehouse="china", carrier="air", status=OrderStatus.QUEUE
        )
        self.shoes = OrderItem.objects.create(
            order=self.order, shipment=self.sh, title="Shoes", warehouse="china",
            shipping_method="air", status=OrderStatus.QUEUE, unit_price=10, quantity=200,
        )
        self.bags = OrderItem.objects.create(
            order=self.order, shipment=self.sh, title="Bags", warehouse="china",
            shipping_method="air", status=OrderStatus.QUEUE, unit_price=20, quantity=100,
        )

    def test_advancing_one_product_leaves_shipment_at_least_advanced(self):
        from .fulfilment import advance_items

        customers, units = advance_items([self.shoes], OrderStatus.SOURCED)
        self.assertEqual((customers, units), (1, 200))
        self.shoes.refresh_from_db(); self.bags.refresh_from_db(); self.sh.refresh_from_db()
        self.assertEqual(self.shoes.status, OrderStatus.SOURCED)
        self.assertEqual(self.bags.status, OrderStatus.QUEUE)  # untouched
        # Shipment is only as far along as its least-advanced item.
        self.assertEqual(self.sh.status, OrderStatus.QUEUE)

    def test_shipment_rolls_up_once_all_items_advance(self):
        from .fulfilment import advance_items

        advance_items([self.shoes, self.bags], OrderStatus.SOURCED)
        self.sh.refresh_from_db()
        self.assertEqual(self.sh.status, OrderStatus.SOURCED)
        self.assertEqual(Order.objects.get(pk=self.order.pk).status, OrderStatus.SOURCED)

    def test_advance_notifies_the_customer_about_the_product(self):
        from .fulfilment import advance_items

        advance_items([self.shoes], OrderStatus.SOURCED)
        thread = self.user.threads.get(slug=f"order-{self.order.reference.lower()}")
        self.assertTrue(thread.messages.filter(body__icontains="Shoes").exists())
        self.assertTrue(thread.messages.filter(body__icontains="sourced").exists())


class FulfilmentBoardViewTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(email="ops@example.com")
        self.staff.is_staff = True
        self.staff.is_superuser = True
        self.staff.save()
        self.client.force_login(self.staff)
        self.customer = User.objects.create_user(email="cust@example.com")
        self.order = Order.objects.create(user=self.customer)
        self.sh = Shipment.objects.create(
            order=self.order, warehouse="china", carrier="air", status=OrderStatus.QUEUE
        )
        self.item = OrderItem.objects.create(
            order=self.order, shipment=self.sh, title="Shoes", warehouse="china",
            shipping_method="air", status=OrderStatus.QUEUE, unit_price=10, quantity=200,
        )
        self.day = timezone.localdate(self.order.placed_at).isoformat()

    def test_drilldown_pages_render(self):
        from django.urls import reverse

        for url in [
            reverse("admin:orders_shipment_fulfilment"),
            reverse("admin:orders_shipment_fulfilment_day", args=["source", self.day]),
            reverse("admin:orders_shipment_fulfilment_batch", args=["source", self.day, "air"]),
        ]:
            self.assertEqual(self.client.get(url).status_code, 200)

    def test_marking_a_product_advances_and_notifies(self):
        from django.urls import reverse

        url = reverse("admin:orders_shipment_fulfilment_batch", args=["source", self.day, "air"])
        res = self.client.post(url, data={"line": "__all__"})
        self.assertEqual(res.status_code, 302)  # redirects back to the batch
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, OrderStatus.SOURCED)
        thread = self.customer.threads.get(slug=f"order-{self.order.reference.lower()}")
        self.assertTrue(thread.messages.filter(body__icontains="Shoes").exists())

    def test_deliver_stage_shows_customers_and_marks_per_order(self):
        from django.urls import reverse

        # Two Lusaka-local orders on the same day, different customers.
        other = User.objects.create_user(email="second@example.com")
        o1 = Order.objects.create(
            user=self.customer, ship_name="Chanda Mwape", ship_line1="Plot 5, Kabulonga",
            ship_city="Lusaka", ship_phone="+260971112222",
        )
        o2 = Order.objects.create(user=other, ship_name="Besa Zulu", ship_line1="12 Chilenje South", ship_city="Lusaka")
        for order, title in ((o1, "LED Headlights"), (o2, "Car Mats")):
            sh = Shipment.objects.create(order=order, warehouse="zambia", carrier="local", status=OrderStatus.QUEUE)
            OrderItem.objects.create(
                order=order, shipment=sh, title=title, warehouse="zambia",
                shipping_method="local", status=OrderStatus.QUEUE, unit_price=100, quantity=1,
            )
        day = timezone.localdate(o1.placed_at).isoformat()
        url = reverse("admin:orders_shipment_fulfilment_batch", args=["deliver", day, "local"])

        # The page shows each customer's delivery details.
        html = self.client.get(url).content.decode()
        for expected in ("Chanda Mwape", "Plot 5, Kabulonga", "+260971112222", o1.reference, "Besa Zulu"):
            self.assertIn(expected, html)

        # Marking ONE order delivers only that customer's items.
        self.client.post(url, data={"order": o1.pk})
        self.assertEqual(Order.objects.get(pk=o1.pk).status, OrderStatus.DELIVERED)
        self.assertEqual(Order.objects.get(pk=o2.pk).status, OrderStatus.PENDING)
        thread = self.customer.threads.get(slug=f"order-{o1.reference.lower()}")
        self.assertTrue(thread.messages.filter(body__icontains="delivered").exists())

    def test_ship_stage_moves_sourced_to_transit_and_notifies(self):
        from django.urls import reverse

        self.item.status = OrderStatus.SOURCED
        self.item.save(update_fields=["status"])
        self.sh.status = OrderStatus.SOURCED
        self.sh.save(update_fields=["status"])
        url = reverse("admin:orders_shipment_fulfilment_batch", args=["ship", self.day, "air"])
        self.assertEqual(self.client.get(url).status_code, 200)  # shows in "To ship"
        self.client.post(url, data={"line": "__all__"})
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, OrderStatus.TRANSIT)
        thread = self.customer.threads.get(slug=f"order-{self.order.reference.lower()}")
        self.assertTrue(thread.messages.filter(body__icontains="left the China hub").exists())


class OrderApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="api@example.com", phone="+260970000000")
        self.user.address_line1 = "Plot 1"
        self.user.address_city = "Lusaka"
        self.user.save()
        self.client.force_login(self.user)

    def test_create_order_from_checkout(self):
        res = self.client.post(
            "/api/orders",
            data={
                "items": [{"title": "Brake Pads", "image": "x", "price": 38.99, "quantity": 2}],
                "carrier": "air",
                "payment": {"brand": "airtel", "detail": "••• 210"},
            },
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertTrue(body["id"].startswith("LX-"))
        self.assertEqual(body["status"], "queue")  # payment present -> paid -> queue
        self.assertEqual(body["total"], 77.98)
        self.assertEqual(body["shippingAddress"], "Plot 1, Lusaka")
        # A paid order is placed and queued -> the shipment has both timeline events.
        statuses = [e["status"] for e in body["shipments"][0]["events"]]
        self.assertIn("pending", statuses)
        self.assertIn("queue", statuses)
        self.assertEqual(body["shipments"][0]["status"], "queue")

    def test_price_is_server_authoritative_for_known_products(self):
        from products.models import Product

        product = Product.objects.create(slug="real-part", title="Real Part", price=50, warehouse="china")
        res = self.client.post(
            "/api/orders",
            data={
                "items": [{"slug": "real-part", "title": "HACKED", "price": 0.01, "quantity": 2}],
                "payment": {"brand": "mtn", "detail": "••• 1"},
            },
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        body = res.json()
        # Server price (50) used, not the tampered 0.01; title from the product.
        self.assertEqual(body["total"], 100.0)
        self.assertEqual(body["items"][0]["price"], 50.0)
        self.assertEqual(body["items"][0]["title"], "Real Part")

    def test_air_carrier_uses_air_price_server_side(self):
        from products.models import Category, Product

        cat = Category.objects.create(slug="cp", name="Car Parts")
        Product.objects.create(
            slug="filter", title="Filter", category=cat, price=40, air_price=58,
            warehouse="china", product_type="car_part",
        )
        # Sea -> sea price.
        sea = self.client.post(
            "/api/orders",
            data={"items": [{"slug": "filter", "title": "x", "price": 1, "quantity": 1}], "carrier": "sea",
                  "payment": {"brand": "mtn", "detail": "1"}},
            content_type="application/json",
        ).json()
        self.assertEqual(sea["total"], 40.0)
        # Air -> air price (server-authoritative, regardless of client price).
        air = self.client.post(
            "/api/orders",
            data={"items": [{"slug": "filter", "title": "x", "price": 1, "quantity": 1}], "carrier": "air",
                  "payment": {"brand": "mtn", "detail": "1"}},
            content_type="application/json",
        ).json()
        self.assertEqual(air["total"], 58.0)

    def test_order_splits_into_shipments_by_hub_and_carrier(self):
        from products.models import Category, Product

        cat = Category.objects.create(slug="c", name="C")
        Product.objects.create(slug="a", title="A", category=cat, price=40, air_price=58, warehouse="china", product_type="car_part")
        Product.objects.create(slug="s", title="S", category=cat, price=20, warehouse="china", product_type="car_part")
        Product.objects.create(slug="l", title="L", category=cat, price=10, warehouse="zambia", product_type="general")
        res = self.client.post(
            "/api/orders",
            data={
                "items": [
                    {"slug": "a", "title": "x", "price": 1, "quantity": 1, "shippingMethod": "air"},
                    {"slug": "s", "title": "x", "price": 1, "quantity": 1, "shippingMethod": "sea"},
                    {"slug": "l", "title": "x", "price": 1, "quantity": 1},
                ],
                "payment": {"brand": "mtn", "detail": "1"},
            },
            content_type="application/json",
        ).json()
        # One order, one payment: total = air 58 + sea 20 + local 10.
        self.assertEqual(res["total"], 88.0)
        by_carrier = {s["carrier"]: s["subtotal"] for s in res["shipments"]}
        self.assertEqual(by_carrier, {"air": 58.0, "sea": 20.0, "local": 10.0})

    def test_air_request_on_sea_only_product_falls_back_to_sea(self):
        from products.models import Category, Product

        cat = Category.objects.create(slug="c2", name="C2")
        Product.objects.create(slug="seaonly", title="SeaOnly", category=cat, price=20, warehouse="china", product_type="car_part")
        res = self.client.post(
            "/api/orders",
            data={
                "items": [{"slug": "seaonly", "title": "x", "price": 1, "quantity": 1, "shippingMethod": "air"}],
                "payment": {"brand": "mtn", "detail": "1"},
            },
            content_type="application/json",
        ).json()
        self.assertEqual(res["total"], 20.0)  # priced as sea, not air
        self.assertEqual(res["items"][0]["shippingMethod"], "sea")

    def test_duplicate_submit_returns_same_order_not_a_second_one(self):
        payload = {
            "items": [{"title": "Brake Pads", "image": "x", "price": 38.99, "quantity": 1}],
            "payment": {"brand": "airtel", "detail": "1"},
            "idempotencyKey": "attempt-abc-123",
        }
        first = self.client.post("/api/orders", data=payload, content_type="application/json")
        second = self.client.post("/api/orders", data=payload, content_type="application/json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)  # replay, not a new order
        self.assertEqual(first.json()["id"], second.json()["id"])
        self.assertEqual(Order.objects.filter(user=self.user).count(), 1)

    def test_different_attempts_create_different_orders(self):
        for key in ("attempt-1", "attempt-2"):
            payload = {
                "items": [{"title": "Item", "image": "x", "price": 10, "quantity": 1}],
                "payment": {"brand": "mtn", "detail": "1"},
                "idempotencyKey": key,
            }
            self.client.post("/api/orders", data=payload, content_type="application/json")
        self.assertEqual(Order.objects.filter(user=self.user).count(), 2)

    def test_create_without_payment_is_pending(self):
        res = self.client.post(
            "/api/orders",
            data={"items": [{"title": "Item", "image": "x", "price": 10, "quantity": 1}]},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["status"], "pending")

    def test_create_requires_items(self):
        res = self.client.post("/api/orders", data={"items": []}, content_type="application/json")
        self.assertEqual(res.status_code, 400)

    def test_list_and_bucket_filter(self):
        Order.objects.create(user=self.user, status=OrderStatus.QUEUE)
        Order.objects.create(user=self.user, status=OrderStatus.SOURCED)
        Order.objects.create(user=self.user, status=OrderStatus.DELIVERED)
        self.assertEqual(len(self.client.get("/api/orders").json()), 3)
        self.assertEqual(len(self.client.get("/api/orders?bucket=queue").json()), 2)
        self.assertEqual(len(self.client.get("/api/orders?bucket=delivered").json()), 1)

    def test_orders_are_scoped_to_user(self):
        other = User.objects.create_user(email="other@example.com")
        Order.objects.create(user=other, status=OrderStatus.QUEUE)
        self.assertEqual(len(self.client.get("/api/orders").json()), 0)

    def test_requires_auth(self):
        self.client.logout()
        self.assertIn(self.client.get("/api/orders").status_code, (401, 403))
