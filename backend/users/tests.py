from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()


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
