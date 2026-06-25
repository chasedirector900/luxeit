from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Order, OrderItem, OrderStatus

User = get_user_model()


class OrderModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="buyer@example.com")

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
        order = Order.objects.create(user=self.user, status=OrderStatus.SOURCING)
        self.assertEqual(order.bucket, "queue")

    def test_set_status_posts_inbox_update(self):
        order = Order.objects.create(user=self.user, status=OrderStatus.QUEUE)
        order.set_status(OrderStatus.TRANSIT)
        self.assertEqual(order.status, OrderStatus.TRANSIT)
        thread = self.user.threads.get(slug=f"order-{order.reference.lower()}")
        self.assertTrue(thread.messages.filter(body__icontains="on its way").exists())

    def test_set_status_logs_a_timeline_event(self):
        order = Order.objects.create(user=self.user, status=OrderStatus.QUEUE)
        order.set_status(OrderStatus.SOURCING)
        self.assertTrue(order.events.filter(status=OrderStatus.SOURCING).exists())

    def test_order_updates_preference_is_honored(self):
        from users.models import NotificationPreferences

        NotificationPreferences.objects.update_or_create(user=self.user, defaults={"order_updates": False})
        order = Order.objects.create(user=self.user, status=OrderStatus.QUEUE)
        order.set_status(OrderStatus.TRANSIT)
        # No inbox message posted...
        self.assertFalse(self.user.threads.filter(slug=f"order-{order.reference.lower()}").exists())
        # ...but the timeline event is still recorded (order data, not a notification).
        self.assertTrue(order.events.filter(status=OrderStatus.TRANSIT).exists())


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
        # A paid order is placed and queued -> two timeline events.
        statuses = [e["status"] for e in body["events"]]
        self.assertIn("pending", statuses)
        self.assertIn("queue", statuses)

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
        Order.objects.create(user=self.user, status=OrderStatus.SOURCING)
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
