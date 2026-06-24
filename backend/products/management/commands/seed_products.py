"""Seed a few example products covering every product type.

Idempotent — run as many times as you like:
    python manage.py seed_products
"""
from django.core.management.base import BaseCommand

from products.models import Category, Product, ProductImage, ProductReview

CATEGORIES = [
    {"slug": "footwear", "name": "Footwear", "blurb": "Shoes, sneakers, boots, sandals", "ordering": 1},
    {"slug": "watches", "name": "Watches", "blurb": "Smartwatches and timepieces", "ordering": 2},
    {"slug": "electronics", "name": "Electronics", "blurb": "Phones, laptops, audio, gaming", "ordering": 3},
    {"slug": "security", "name": "Security", "blurb": "CCTV, alarms, smart locks", "ordering": 4},
    {"slug": "car-parts", "name": "Car Parts", "blurb": "Parts and accessories", "ordering": 5},
    {"slug": "general", "name": "General", "blurb": "Everything else", "ordering": 6},
]

# Each product carries the type-specific fields its product_type needs, plus a
# required thumbnail (`image`), >=1 gallery image, an optional video, a hub
# (`warehouse`) for physical goods, and a units_sold count.
PRODUCTS = [
    {
        "slug": "smart-cctv-4k-hub-kit", "title": "Smart CCTV 4K Hub Kit", "product_type": "security",
        "category": "security", "sub_category": "cameras", "price": 129.00, "original_price": 159.00,
        "image": "/images/mock-products/security-kit.svg", "warehouse": "china", "origin": "China",
        "shipping_method": "air", "delivery_estimate": "5-10 days", "import_tag": "Import", "preorder": True,
        "units_sold": 41200, "searchable_text": "security cctv camera monitor dvr hub",
        "video": "/videos/products/security-kit-demo.mp4", "video_thumbnail": "/images/mock-products/security-kit.svg",
        "images": [
            {"src": "/images/mock-products/security-kit.svg", "alt": "CCTV kit front", "position": 1},
            {"src": "/images/mock-products/security-kit.svg", "alt": "CCTV kit ports", "position": 2}],
        "spec_groups": [{"title": "Security Specifications", "specs": [
            {"label": "Resolution", "value": "4K UHD"}, {"label": "Camera Count", "value": "4 Cameras"},
            {"label": "Night Vision", "value": "Up to 25m"}, {"label": "Storage", "value": "1TB DVR Included"}]}],
        "package_contents": ["4x CCTV Cameras", "1x DVR Unit", "Power Adapter Set", "Mounting Screws + Cable"],
        "notices": ["Installation service available on request."],
        "review_tags": [{"label": "Product Quality", "count": 422}, {"label": "Fast Delivery", "count": 288}],
        "reviews": [
            {"user_name": "Kristin Lynch", "avatar_initial": "K", "rating": 5, "date": "2026-05-18",
             "text": "Very clear night vision and easy setup.", "helpful_count": 1},
            {"user_name": "Ravi Kant Bhargava", "avatar_initial": "R", "rating": 1, "date": "2026-04-25",
             "text": "Had issues with my first DVR unit but support helped me replace it. Setup instructions can be clearer.",
             "helpful_count": 8,
             "reply_text": "Sorry about the issue. We've shared a step-by-step setup guide and replacement support in your inbox.",
             "reply_author": "LUXEIT Support", "reply_date": "2026-04-29"},
            {"user_name": "Jay", "avatar_initial": "J", "rating": 4, "date": "2026-05-06",
             "text": "Good quality cameras for the price.", "helpful_count": 4}],
    },
    {
        "slug": "led-headlight-dual-pack", "title": "LED Headlight Dual Pack", "product_type": "car_part",
        "category": "car-parts", "price": 48.00, "image": "/images/mock-products/headlight.svg",
        "warehouse": "zambia", "origin": "China", "shipping_method": "sea", "delivery_estimate": "6-12 days",
        "import_tag": "Import", "units_sold": 9400, "searchable_text": "car parts led headlight auto",
        "images": [
            {"src": "/images/mock-products/headlight.svg", "alt": "Beam pattern", "position": 1},
            {"src": "/images/mock-products/headlight.svg", "alt": "Socket detail", "position": 2}],
        "compatibility": {"title": "Vehicle Compatibility", "required": True, "fields": [
            {"key": "vehicle", "label": "Select vehicle", "required": True,
             "values": ["Toyota Corolla 2014-2018", "Honda Fit 2015-2020", "Nissan Note 2016-2021"]},
            {"key": "position", "label": "Part position", "required": True, "values": ["Front Left", "Front Right"]}],
            "note": "Confirm compatibility before order."},
        "spec_groups": [{"title": "Electrical Specs", "specs": [
            {"label": "Voltage", "value": "12V"}, {"label": "Socket", "value": "H11"}, {"label": "Color Temp", "value": "6500K"}]}],
        "notices": ["Installation by qualified technician recommended."],
        "review_tags": [{"label": "Brightness", "count": 96}, {"label": "Fitment", "count": 88}],
        "reviews": [{"user_name": "P. Zulu", "avatar_initial": "P", "rating": 4, "date": "2026-05-01",
                     "text": "Good brightness and clean beam pattern.", "helpful_count": 5}],
    },
    {
        "slug": "aerorun-pro-sneakers", "title": "AeroRun Pro Sneakers", "product_type": "footwear",
        "category": "footwear", "sub_category": "sneakers", "price": 59.99, "original_price": 69.99,
        "image": "/images/mock-products/sling-bag.svg", "warehouse": "zambia", "origin": "Global",
        "shipping_method": "air", "delivery_estimate": "24-48 hrs", "units_sold": 28100,
        "searchable_text": "running sneakers shoes footwear",
        "images": [
            {"src": "/images/mock-products/sling-bag.svg", "alt": "Side profile", "position": 1},
            {"src": "/images/mock-products/sling-bag.svg", "alt": "Sole", "position": 2}],
        "options": [
            {"name": "Size", "key": "size", "required": True, "values": ["39", "40", "41", "42", "43"],
             "stockByValue": {"39": 5, "40": 7, "41": 3, "42": 4, "43": 2}},
            {"name": "Color", "key": "color", "required": False, "values": ["Black", "White", "Blue"]}],
        "spec_groups": [{"title": "Material & Fit", "specs": [
            {"label": "Upper", "value": "Breathable mesh"}, {"label": "Sole", "value": "EVA foam"}, {"label": "Fit", "value": "True to size"}]}],
        "notices": ["Size guide: choose your normal size for the best fit."],
        "review_tags": [{"label": "Comfort", "count": 222}, {"label": "Material", "count": 178}],
        "reviews": [{"user_name": "L. Mwansa", "avatar_initial": "L", "rating": 5, "date": "2026-05-14",
                     "text": "Stylish and comfortable for daily use. Fits true to size.", "helpful_count": 7}],
    },
    {
        "slug": "pulse-smartwatch", "title": "Pulse Smartwatch", "product_type": "watch",
        "category": "watches", "sub_category": "wearables", "price": 119.99, "original_price": 149.99,
        "image": "/images/mock-products/mousepad.svg", "warehouse": "china", "origin": "China",
        "shipping_method": "air", "delivery_estimate": "5-10 days", "import_tag": "Import",
        "units_sold": 67500, "searchable_text": "smartwatch watch wearable amoled gps",
        "images": [
            {"src": "/images/mock-products/mousepad.svg", "alt": "Watch face", "position": 1},
            {"src": "/images/mock-products/mousepad.svg", "alt": "Strap", "position": 2}],
        "options": [{"name": "Strap Color", "key": "strap_color", "required": False, "values": ["Black", "Midnight Blue", "Silver"]}],
        "spec_groups": [{"title": "Watch Specifications", "specs": [
            {"label": "Water Resistance", "value": "30m"}, {"label": "Display", "value": "AMOLED"},
            {"label": "Battery Type", "value": "Rechargeable"}, {"label": "Case Size", "value": "42mm"}]}],
        "notices": ["Imported item includes 6-month seller warranty."],
        "review_tags": [{"label": "Value for Money", "count": 191}, {"label": "Design", "count": 133}],
        "reviews": [{"user_name": "Chisomo", "avatar_initial": "C", "rating": 4, "date": "2026-05-09",
                     "text": "Bright display and solid battery life.", "helpful_count": 2}],
    },
    {
        "slug": "psn-gift-card-20", "title": "PSN Gift Card $20", "product_type": "digital",
        "category": "general", "price": 21.50, "image": "/images/mock-products/ps5-dock.svg",
        "origin": "Global", "delivery_estimate": "Within 15 minutes", "units_sold": 19800,
        "searchable_text": "psn playstation gift card digital code wallet",
        "images": [{"src": "/images/mock-products/ps5-dock.svg", "alt": "Gift card", "position": 1}],
        "spec_groups": [{"title": "Delivery", "specs": [
            {"label": "Region", "value": "Global"}, {"label": "Delivery Type", "value": "Instant digital code"},
            {"label": "Delivery Estimate", "value": "Within 15 minutes"}]}],
        "notices": ["Redemption instructions are provided after payment confirmation."],
        "review_tags": [{"label": "Fast Delivery", "count": 143}],
        "reviews": [{"user_name": "M. Banda", "avatar_initial": "M", "rating": 5, "date": "2026-05-11",
                     "text": "Code arrived within minutes. Worked instantly.", "helpful_count": 8}],
    },
    {
        "slug": "skin-care-mini-device-kit", "title": "Skin Care Mini Device Kit", "product_type": "general",
        "category": "general", "price": 26.75, "image": "/images/mock-products/skin-care.svg",
        "warehouse": "china", "origin": "China", "shipping_method": "sea", "delivery_estimate": "7-13 days",
        "import_tag": "Import", "units_sold": 12600, "searchable_text": "beauty skin care wellness device",
        "images": [
            {"src": "/images/mock-products/skin-care.svg", "alt": "Device kit", "position": 1},
            {"src": "/images/mock-products/skin-care.svg", "alt": "Contents", "position": 2}],
        "review_tags": [{"label": "Packaging", "count": 62}, {"label": "Results", "count": 54}],
        "reviews": [{"user_name": "N. Phiri", "avatar_initial": "N", "rating": 4, "date": "2026-05-02",
                     "text": "Compact kit and simple to use at home.", "helpful_count": 1}],
    },
]


class Command(BaseCommand):
    help = "Seed example categories and products (one per product type)."

    def handle(self, *args, **options):
        cats = {}
        for c in CATEGORIES:
            obj, _ = Category.objects.update_or_create(slug=c["slug"], defaults=c)
            cats[c["slug"]] = obj

        for data in PRODUCTS:
            data = dict(data)
            reviews = data.pop("reviews", [])
            images = data.pop("images", [])
            data["category"] = cats.get(data.pop("category", None))
            data.setdefault(
                "description",
                f"{data['title']} — quality-checked import sourced from verified suppliers, "
                "with reliable delivery across Zambia.",
            )
            product, _ = Product.objects.update_or_create(slug=data["slug"], defaults=data)

            product.images.all().delete()
            ProductImage.objects.bulk_create([ProductImage(product=product, **img) for img in images])

            product.reviews.all().delete()
            ProductReview.objects.bulk_create([ProductReview(product=product, **r) for r in reviews])
            product.recalculate_ratings()

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {Category.objects.count()} categories, {Product.objects.count()} products, "
            f"{ProductImage.objects.count()} images."
        ))
