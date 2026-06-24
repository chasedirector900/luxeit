from django.core.management import call_command
from django.test import TestCase

from .models import Category, Product, ProductType


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
        call_command("seed_car_reviews")

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
        call_command("seed_car_reviews")
        after = sum(p.reviews.count() for p in Product.objects.filter(product_type=ProductType.CAR_PART))
        self.assertEqual(before, after)
