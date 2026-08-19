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
            Product.objects.create(slug=f"p{i}", title=f"P{i}", price=1, warehouse="china")
        res = self.client.get("/api/products")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), PRODUCT_LIST_CAP)


class ErrorGateTests(TestCase):
    """Every API error is human-readable; nothing technical leaks out."""

    def test_unhandled_exception_becomes_friendly_json(self):
        from api.exceptions import FRIENDLY_500, api_exception_handler

        response = api_exception_handler(RuntimeError("db exploded: secret table xyz"), {"request": None})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data["detail"], FRIENDLY_500)
        self.assertNotIn("db exploded", str(response.data))  # internals never leak

    def test_throttle_message_reads_like_a_person(self):
        from rest_framework.exceptions import Throttled

        from api.exceptions import api_exception_handler

        response = api_exception_handler(Throttled(wait=42), {"request": None})
        self.assertEqual(response.status_code, 429)
        self.assertIn("too fast", response.data["detail"])
        self.assertIn("42 seconds", response.data["detail"])
        self.assertNotIn("throttled", response.data["detail"].lower())  # no jargon


class BlockedIPTests(TestCase):
    """The emergency blocklist rejects an IP before any view runs."""

    def test_blocked_ip_gets_403_everywhere(self):
        with self.settings(BLOCKED_IPS={"203.0.113.7"}):
            res = self.client.get("/api/health", REMOTE_ADDR="203.0.113.7")
            self.assertEqual(res.status_code, 403)
            # Everyone else is unaffected.
            self.assertEqual(self.client.get("/api/health", REMOTE_ADDR="10.0.0.5").status_code, 200)


class OtpCircuitBreakerTests(TestCase):
    """The global send budget stops code delivery past the hourly cap."""

    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_code_sending_stops_at_the_global_cap(self):
        with self.settings(OTP_GLOBAL_HOURLY_CAP=2):
            for i in range(2):
                res = self.client.post(
                    "/api/auth/request-code",
                    data={"identifier": f"person{i}@example.com"},
                    content_type="application/json",
                )
                self.assertEqual(res.status_code, 200)
            res = self.client.post(
                "/api/auth/request-code",
                data={"identifier": "person3@example.com"},
                content_type="application/json",
            )
            self.assertEqual(res.status_code, 429)  # breaker open — bill protected


class AdminLockoutTests(TestCase):
    """django-axes locks the admin login after repeated failures."""

    def setUp(self):
        self.staff = User.objects.create_user(email="boss@example.com", password="correct-horse-battery")
        self.staff.is_staff = True
        self.staff.save()

    def test_admin_login_locks_after_failures(self):
        for _ in range(5):
            self.client.post("/admin/login/", {"username": "boss@example.com", "password": "wrong"})
        # Even the CORRECT password is refused while locked out.
        res = self.client.post(
            "/admin/login/", {"username": "boss@example.com", "password": "correct-horse-battery"}
        )
        self.assertEqual(res.status_code, 429)
        self.assertFalse(res.wsgi_request.user.is_authenticated)
