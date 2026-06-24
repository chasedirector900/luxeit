from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()


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
