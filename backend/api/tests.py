from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase

from products.models import Product
from products.views import PRODUCT_LIST_CAP

from .throttling import OrderCreateThrottle

User = get_user_model()


class RateLimitTests(TestCase):
    """Abuse guards: expensive writes are throttled, reads never are."""

    def setUp(self):
        cache.clear()  # throttle counters live in the cache — isolate each test
        self.user = User.objects.create_user(email="buyer@example.com")
        self.user.address_line1 = "Plot 1"
        self.user.address_city = "Lusaka"
        self.user.save()
        self.client.force_login(self.user)

    def tearDown(self):
        cache.clear()

    def _order_payload(self):
        return {
            "items": [{"title": "Thing", "image": "x", "price": 10, "quantity": 1}],
            "payment": {"brand": "mtn", "detail": "1"},
        }

    def test_order_creation_throttles_after_limit(self):
        # Tighten the rate so the test is fast; restore afterwards.
        OrderCreateThrottle.rate = "2/hour"
        try:
            for _ in range(2):
                res = self.client.post("/api/orders", data=self._order_payload(), content_type="application/json")
                self.assertEqual(res.status_code, 201)
            res = self.client.post("/api/orders", data=self._order_payload(), content_type="application/json")
            self.assertEqual(res.status_code, 429)  # third strike — throttled
            # Reads on the same endpoint are unaffected.
            self.assertEqual(self.client.get("/api/orders").status_code, 200)
        finally:
            del OrderCreateThrottle.rate

    def test_support_messages_throttle(self):
        from api.throttling import SupportMessageThrottle

        SupportMessageThrottle.rate = "1/hour"
        try:
            first = self.client.post(
                "/api/inbox/threads/support/messages", data={"body": "hi"}, content_type="application/json"
            )
            self.assertEqual(first.status_code, 201)
            second = self.client.post(
                "/api/inbox/threads/support/messages", data={"body": "hi again"}, content_type="application/json"
            )
            self.assertEqual(second.status_code, 429)
        finally:
            del SupportMessageThrottle.rate


class ProductListCapTests(TestCase):
    def test_list_never_exceeds_cap(self):
        for i in range(PRODUCT_LIST_CAP + 5):
            Product.objects.create(slug=f"p{i}", title=f"P{i}", price=1, warehouse="china", image="x")
        res = self.client.get("/api/products")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), PRODUCT_LIST_CAP)
