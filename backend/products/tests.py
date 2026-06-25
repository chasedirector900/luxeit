from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from .models import Category, Product, ProductReview, ProductType

User = get_user_model()


class ProductReviewApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="buyer@example.com")
        self.client.force_login(self.user)
        self.product = Product.objects.create(slug="widget", title="Widget", price=20, warehouse="china")

    def _buy(self, status="delivered"):
        from orders.models import Order, OrderItem

        order = Order.objects.create(user=self.user, status=status)
        OrderItem.objects.create(order=order, product=self.product, title="Widget", unit_price=20, quantity=1)

    def test_cannot_review_without_purchase(self):
        self.assertFalse(self.client.get("/api/products/widget/review").json()["canReview"])
        res = self.client.post(
            "/api/products/widget/review",
            data={"rating": 5, "text": "great"},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 403)
        self.assertEqual(self.product.reviews.count(), 0)

    def test_pending_order_does_not_grant_review(self):
        self._buy(status="pending")
        self.assertFalse(self.client.get("/api/products/widget/review").json()["canReview"])

    def test_buyer_can_review_and_it_is_verified(self):
        self._buy()
        self.assertTrue(self.client.get("/api/products/widget/review").json()["canReview"])
        res = self.client.post(
            "/api/products/widget/review",
            data={"rating": 4, "text": "solid"},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        review = self.product.reviews.get()
        self.assertTrue(review.verified)
        self.assertEqual(review.rating, 4)
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.rating_average), 4.0)

    def test_reposting_updates_not_duplicates(self):
        self._buy()
        self.client.post("/api/products/widget/review", data={"rating": 3, "text": "ok"}, content_type="application/json")
        self.client.post("/api/products/widget/review", data={"rating": 5, "text": "better"}, content_type="application/json")
        self.assertEqual(self.product.reviews.count(), 1)
        self.assertEqual(self.product.reviews.get().rating, 5)

    def test_rating_must_be_valid(self):
        self._buy()
        res = self.client.post("/api/products/widget/review", data={"rating": 9}, content_type="application/json")
        self.assertEqual(res.status_code, 400)

    def test_phone_only_user_review_shows_masked_name(self):
        from django.test import Client
        from orders.models import Order, OrderItem

        phone_user = User.objects.create_user(phone="+260971234567")
        order = Order.objects.create(user=phone_user, status="delivered")
        OrderItem.objects.create(order=order, product=self.product, title="Widget", unit_price=20, quantity=1)
        c = Client()
        c.force_login(phone_user)
        res = c.post("/api/products/widget/review", data={"rating": 5, "text": "good"}, content_type="application/json")
        self.assertEqual(res.status_code, 201)
        review = self.product.reviews.get(user=phone_user)
        self.assertEqual(review.user_name, "Customer ••4567")


class CarCatalogSeedTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_car_catalog")

    def test_brand_and_universal_categories_created(self):
        for slug in ["toyota", "nissan", "honda", "mazda", "isuzu", "ford", "universal-car-parts"]:
            self.assertTrue(Category.objects.filter(slug=slug).exists(), slug)

    def test_products_are_car_parts_with_chrome(self):
        toyota = Category.objects.get(slug="toyota")
        self.assertTrue(toyota.chips and toyota.hero and toyota.features)
        products = toyota.products.all()
        self.assertGreater(products.count(), 0)
        self.assertTrue(all(p.product_type == ProductType.CAR_PART for p in products))
        self.assertTrue(all(p.image.startswith("data:image/svg+xml") for p in products))

    def test_seeder_is_idempotent(self):
        before = Product.objects.count()
        call_command("seed_car_catalog")
        self.assertEqual(Product.objects.count(), before)


class DualShippingPriceTests(TestCase):
    def test_china_product_exposes_air_price_and_options(self):
        from django.test import Client

        cat = Category.objects.create(slug="c", name="C")
        Product.objects.create(
            slug="part", title="Part", category=cat, price=40, air_price=58,
            warehouse="china", product_type=ProductType.CAR_PART,
        )
        data = Client().get("/api/products/part/").json()
        self.assertEqual(data["price"], 40.0)
        self.assertEqual(data["airPrice"], 58.0)
        methods = {o["method"]: o["price"] for o in data["shippingOptions"]}
        self.assertEqual(methods, {"sea": 40.0, "air": 58.0})

    def test_air_price_rejected_for_zambia_or_below_sea(self):
        from django.core.exceptions import ValidationError

        zambia = Product(slug="z", title="Z", price=40, air_price=58, warehouse="zambia")
        with self.assertRaises(ValidationError):
            zambia.full_clean()
        cheap_air = Product(slug="ca", title="CA", price=40, air_price=30, warehouse="china")
        with self.assertRaises(ValidationError):
            cheap_air.full_clean()


class CategoryApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_car_catalog")

    def test_category_listing_payload(self):
        res = self.client.get("/api/categories/toyota/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        for key in ["slug", "title", "subtitle", "searchPlaceholder", "hero", "chips", "features", "products"]:
            self.assertIn(key, data)
        self.assertGreater(len(data["products"]), 0)
        product = data["products"][0]
        for key in ["id", "slug", "title", "subtitle", "subCategory", "price", "image"]:
            self.assertIn(key, product)

    def test_product_detail_includes_category_slug(self):
        slug = self.client.get("/api/categories/toyota/").json()["products"][0]["slug"]
        res = self.client.get(f"/api/products/{slug}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["categorySlug"], "toyota")

    def test_unknown_category_404(self):
        self.assertEqual(self.client.get("/api/categories/nope/").status_code, 404)


class CarReviewSeedTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_car_catalog")
        call_command("seed_reviews")

    def test_products_get_reviews_and_aggregates(self):
        product = Product.objects.filter(product_type=ProductType.CAR_PART).first()
        self.assertGreaterEqual(product.reviews.count(), 3)
        self.assertGreater(product.rating_count, 0)
        self.assertGreater(float(product.rating_average), 0)
        self.assertTrue(product.review_tags)

    def test_detail_api_returns_ratings_block(self):
        slug = self.client.get("/api/categories/toyota/").json()["products"][0]["slug"]
        ratings = self.client.get(f"/api/products/{slug}/").json()["ratings"]
        for key in ["ratingAverage", "ratingCount", "ratingBreakdown", "reviewTags", "reviews"]:
            self.assertIn(key, ratings)
        self.assertGreater(len(ratings["reviews"]), 0)

    def test_review_seeder_is_idempotent(self):
        before = sum(p.reviews.count() for p in Product.objects.filter(product_type=ProductType.CAR_PART))
        call_command("seed_reviews")
        after = sum(p.reviews.count() for p in Product.objects.filter(product_type=ProductType.CAR_PART))
        self.assertEqual(before, after)
