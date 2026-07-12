from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()


class AccountResourceIsolationTests(TestCase):
    """Addresses, payment methods and saved items are strictly per-account —
    switching users on the same device can never leak another person's data."""

    def setUp(self):
        self.alice = User.objects.create_user(email="alice@example.com")
        self.bob = User.objects.create_user(email="bob@example.com")

    def test_addresses_are_per_account(self):
        self.client.force_login(self.alice)
        self.client.post(
            "/api/auth/addresses",
            data={"line1": "Plot 9, Kabulonga", "city": "Lusaka", "area": "Kabulonga"},
            content_type="application/json",
        )
        self.assertEqual(len(self.client.get("/api/auth/addresses").json()), 1)
        # Bob logs in on the SAME client (same device) — sees nothing of Alice's.
        self.client.force_login(self.bob)
        self.assertEqual(self.client.get("/api/auth/addresses").json(), [])

    def test_payment_methods_are_per_account_and_masked_only(self):
        self.client.force_login(self.alice)
        res = self.client.post(
            "/api/auth/payment-methods",
            data={"brand": "visa", "detail": "•••• 4242", "token": "tok_abc", "expMonth": 12, "expYear": 2028},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertNotIn("token", res.json())  # the vault token never goes back out
        self.client.force_login(self.bob)
        self.assertEqual(self.client.get("/api/auth/payment-methods").json(), [])

    def test_first_address_becomes_default_and_mirrors_profile(self):
        self.client.force_login(self.alice)
        self.client.post(
            "/api/auth/addresses",
            data={"line1": "12 Chilenje South", "city": "Lusaka", "area": ""},
            content_type="application/json",
        )
        self.alice.refresh_from_db()
        self.assertEqual(self.alice.address_line1, "12 Chilenje South")

    def test_anonymous_gets_nothing(self):
        for path in ("/api/auth/addresses", "/api/auth/payment-methods", "/api/saved"):
            self.assertIn(self.client.get(path).status_code, (401, 403))

    def test_saved_items_are_per_account(self):
        from products.models import Product

        Product.objects.create(slug="w1", title="Widget", price=10, warehouse="china")
        self.client.force_login(self.alice)
        self.assertEqual(self.client.put("/api/saved/w1").json(), {"saved": True})
        self.assertEqual(len(self.client.get("/api/saved").json()), 1)
        self.client.force_login(self.bob)
        self.assertEqual(self.client.get("/api/saved").json(), [])
        # Bob's unsave is scoped to Bob — Alice's heart stays intact.
        self.assertEqual(self.client.delete("/api/saved/w1").json(), {"saved": False})
        self.client.force_login(self.alice)
        self.assertEqual(len(self.client.get("/api/saved").json()), 1)


class PublicDisplayNameTests(TestCase):
    def test_prefers_full_name(self):
        u = User.objects.create_user(email="a@b.com", full_name="Chanda Mwale")
        self.assertEqual(u.public_display_name, "Chanda Mwale")

    def test_email_handle_when_no_name(self):
        u = User.objects.create_user(email="chanda.m@example.com")
        self.assertEqual(u.public_display_name, "chanda.m")

    def test_phone_only_is_masked_to_last_4(self):
        u = User.objects.create_user(phone="+260971234567")
        self.assertEqual(u.public_display_name, "Customer ••4567")


class ProfileAddressApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="shopper@example.com")
        self.client.force_login(self.user)

    def test_me_returns_null_address_when_unset(self):
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.json()["address"])

    def test_patch_saves_address_to_backend(self):
        res = self.client.patch(
            "/api/auth/me",
            data={"address": {"line1": "Plot 12, Great East Rd", "city": "Lusaka", "area": "Avondale"}},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["address"], {"line1": "Plot 12, Great East Rd", "city": "Lusaka", "area": "Avondale"})

        self.user.refresh_from_db()
        self.assertEqual(self.user.address_line1, "Plot 12, Great East Rd")
        self.assertEqual(self.user.address_city, "Lusaka")
        self.assertEqual(self.user.address_area, "Avondale")

    def test_patch_name_and_address_together(self):
        res = self.client.patch(
            "/api/auth/me",
            data={"full_name": "Chanda Mwale", "address": {"line1": "10 Cha Cha Cha Rd", "city": "Ndola", "area": ""}},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["full_name"], "Chanda Mwale")
        self.assertEqual(body["address"]["city"], "Ndola")

    def test_patch_empty_address_clears_it(self):
        self.user.address_line1 = "old"
        self.user.address_city = "old city"
        self.user.save()
        res = self.client.patch(
            "/api/auth/me",
            data={"address": None},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.json()["address"])
