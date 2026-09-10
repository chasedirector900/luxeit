"""Seed the non-car shop categories (footwear, watches, electronics, security)
as backend-driven catalogue data: each category carries its listing chrome
(chips/features/hero) and a set of products with subtitles and, for China-hub
goods, dual sea/air pricing. Idempotent: clears and recreates these categories.
"""
from django.core.management.base import BaseCommand

from ._demo_catalog import EXTRA_PRODUCTS, NEW_CATEGORIES
from products.models import Category, Product, ProductType, Warehouse, Origin, ShippingMethod

FOOTWEAR_SIZES = [str(n) for n in range(38, 46)]  # EU 38-45


FEATURES = [
    {"icon": "ShieldCheck", "title": "Trusted Suppliers", "subtitle": "Quality you can trust", "tint": "text-gold-500", "ring": "bg-gold-500/10"},
    {"icon": "Truck", "title": "Fast Shipping", "subtitle": "China & Lusaka hubs", "tint": "text-gold-400", "ring": "bg-gold-400/10"},
    {"icon": "RotateCcw", "title": "Easy Returns", "subtitle": "Hassle-free returns", "tint": "text-gold-300", "ring": "bg-gold-300/10"},
]

# Each product: (sub_category, name, subtitle, sea_price, warehouse, original_price|None)
CATEGORIES = [
    {
        "slug": "footwear", "name": "Footwear", "type": ProductType.FOOTWEAR,
        "subtitle": "Browse trending shoes, sneakers, boots, and sandals",
        "search": "Search footwear...",
        "hero": {"badge": "New Collection", "title": "New Season Footwear", "subtitle": "Top picks from trusted suppliers"},
        "chips": [
            {"key": "all", "label": "All", "icon": "Sparkles"},
            {"key": "sneakers", "label": "Sneakers", "icon": "Footprints"},
            {"key": "boots", "label": "Boots", "icon": "Snowflake"},
            {"key": "sandals", "label": "Sandals", "icon": "Sun"},
            {"key": "formal", "label": "Formal", "icon": "Briefcase"},
            {"key": "sports", "label": "Sports", "icon": "Dumbbell"},
        ],
        "products": [
            ("sneakers", "AeroRun Pro Sneakers", "Men's running shoes", 59.99, "china", 69.99),
            ("sneakers", "Urban Casual Sneakers", "Everyday casual shoes", 49.99, "china", None),
            ("boots", "Explorer Chelsea Boots", "Men's leather boots", 89.99, "china", None),
            ("boots", "Rugged Trail Hiking Boots", "Outdoor hiking boots", 74.99, "china", 94.99),
            ("sandals", "Comfort Trail Sandals", "Men's sandals", 39.99, "zambia", None),
            ("formal", "Oxford Leather Dress Shoes", "Men's formal shoes", 99.99, "china", None),
            ("formal", "Classic Leather Loafers", "Slip-on formal shoes", 79.99, "zambia", None),
            ("sports", "Marathon Speed Runners", "Performance running shoes", 84.99, "china", 99.99),
        ],
    },
    {
        "slug": "watches", "name": "Watches", "type": ProductType.WATCH,
        "subtitle": "Browse analog, digital, smart, and luxury timepieces",
        "search": "Search watches...",
        "hero": {"badge": "New Collection", "title": "Timeless & Smart", "subtitle": "Curated watches from trusted suppliers"},
        "chips": [
            {"key": "all", "label": "All", "icon": "Sparkles"},
            {"key": "analog", "label": "Analog", "icon": "Clock"},
            {"key": "digital", "label": "Digital", "icon": "Timer"},
            {"key": "smart", "label": "Smart", "icon": "Watch"},
            {"key": "luxury", "label": "Luxury", "icon": "Crown"},
            {"key": "sport", "label": "Sport", "icon": "Activity"},
        ],
        "products": [
            ("analog", "Heritage Analog Watch", "Stainless steel, leather strap", 64.99, "china", None),
            ("digital", "PulseTrack Digital Watch", "Backlit, water resistant", 39.99, "china", None),
            ("smart", "Pulse Smartwatch", "Heart-rate & notifications", 119.99, "china", 149.99),
            ("smart", "FitBand Active Tracker", "Steps, sleep & calls", 54.99, "china", None),
            ("luxury", "Aurum Chronograph", "Premium chronograph", 199.99, "china", None),
            ("sport", "TrailMate Sport Watch", "Rugged outdoor watch", 49.99, "zambia", None),
            ("analog", "Minimalist Slim Watch", "Thin dial, mesh band", 44.99, "china", 54.99),
        ],
    },
    {
        "slug": "electronics", "name": "Electronics", "type": ProductType.GENERAL,
        "subtitle": "Phones, laptops, audio, TVs, and smart gadgets",
        "search": "Search electronics...",
        "hero": {"badge": "Top Tech", "title": "Latest Electronics", "subtitle": "Genuine gadgets from trusted suppliers"},
        "chips": [
            {"key": "all", "label": "All", "icon": "Sparkles"},
            {"key": "phones", "label": "Phones", "icon": "Smartphone"},
            {"key": "laptops", "label": "Laptops", "icon": "Laptop"},
            {"key": "audio", "label": "Audio", "icon": "Headphones"},
            {"key": "tvs", "label": "TVs", "icon": "Tv"},
            {"key": "gaming", "label": "Gaming", "icon": "Gamepad2"},
            {"key": "cameras", "label": "Cameras", "icon": "Camera"},
        ],
        "products": [
            ("phones", "Nova X Smartphone", '6.7" display, 128GB', 289.99, "china", 329.99),
            ("audio", "BassPro Wireless Earbuds", "ANC, 30h battery", 44.99, "china", None),
            ("audio", "SoundWave Bluetooth Speaker", "Portable, waterproof", 59.99, "china", None),
            ("laptops", "SwiftBook 14 Laptop", "8GB RAM, 256GB SSD", 449.99, "china", 499.99),
            ("tvs", 'VisionPlus 43" Smart TV', "4K UHD, Android TV", 329.99, "china", None),
            ("gaming", "PS5 Cooling Dock Pro", "Cooling & charging dock", 32.50, "china", None),
            ("gaming", "GamePad Wireless Controller", "Low-latency, USB-C", 27.99, "china", None),
            ("cameras", "StreamCam 1080p Webcam", "Full HD webcam", 34.99, "zambia", None),
        ],
    },
    {
        "slug": "security", "name": "Security", "type": ProductType.SECURITY,
        "subtitle": "CCTV, alarms, smart locks, sensors, and safety gear",
        "search": "Search security...",
        "hero": {"badge": "Stay Protected", "title": "Home & Business Security", "subtitle": "Trusted security gear from verified suppliers"},
        "chips": [
            {"key": "all", "label": "All", "icon": "Sparkles"},
            {"key": "cameras", "label": "CCTV", "icon": "Cctv"},
            {"key": "alarms", "label": "Alarms", "icon": "Siren"},
            {"key": "locks", "label": "Smart Locks", "icon": "Lock"},
            {"key": "sensors", "label": "Sensors", "icon": "Radar"},
            {"key": "access", "label": "Access", "icon": "Fingerprint"},
        ],
        "products": [
            ("cameras", "Smart CCTV 4K Hub Kit", "4-cam 4K NVR kit", 129.00, "china", 159.00),
            ("cameras", "MiniCam Wireless Camera", "1080p, night vision", 39.99, "china", None),
            ("alarms", "GuardBell Smart Alarm", "Wireless siren + app", 49.99, "china", None),
            ("locks", "SecureLock Smart Lock", "Fingerprint + code", 89.99, "china", 109.99),
            ("sensors", "MotionGuard PIR Sensors (3-Pack)", "Motion detection", 24.99, "china", None),
            ("access", "FingerAccess Reader", "Fingerprint access control", 64.99, "china", None),
            ("cameras", "Doorbell Cam Pro", "Video doorbell, 2-way audio", 74.99, "zambia", None),
        ],
    },
]


def slugify(name: str) -> str:
    out = name.lower()
    for ch in ['(', ')', '"', "'", ",", ".", "/"]:
        out = out.replace(ch, "")
    return "-".join(out.split())


class Command(BaseCommand):
    help = "Seed footwear/watches/electronics/security categories and products."

    def handle(self, *args, **options):
        all_categories = CATEGORIES + NEW_CATEGORIES
        managed = [c["slug"] for c in all_categories]
        # Clean slate for these categories (and drop any legacy one-off products).
        Product.objects.filter(category__slug__in=managed).delete()
        Product.objects.filter(slug__in=[
            "skin-care-mini-device-kit", "psn-gift-card-20", "pulse-smartwatch",
            "aerorun-pro-sneakers", "smart-cctv-4k-hub-kit",
        ]).delete()

        cats = prods = 0
        for ci, cdef in enumerate(all_categories):
            category, _ = Category.objects.update_or_create(
                slug=cdef["slug"],
                defaults={
                    "name": cdef["name"],
                    "blurb": cdef["subtitle"],
                    "subtitle": cdef["subtitle"],
                    "search_placeholder": cdef["search"],
                    "hero": cdef["hero"],
                    "chips": cdef["chips"],
                    "features": FEATURES,
                    "ordering": ci,
                    "is_active": True,
                },
            )
            cats += 1
            items = cdef["products"] + EXTRA_PRODUCTS.get(cdef["slug"], [])
            for pi, (sub, name, subtitle, price, wh, original) in enumerate(items):
                china = wh == "china"
                Product.objects.create(
                    slug=slugify(name),
                    title=name,
                    product_type=cdef["type"],
                    category=category,
                    sub_category=sub,
                    subtitle=subtitle,
                    price=price,
                    original_price=original,
                    air_price=round(price * 1.45, 2) if china else None,
                    warehouse=Warehouse.CHINA if china else Warehouse.ZAMBIA,
                    origin=Origin.CHINA if china else Origin.GLOBAL,
                    shipping_method=ShippingMethod.SEA if china else "",
                    delivery_estimate="10-18 days" if china else "1-2 days (Lusaka)",
                    import_tag="China import" if china else "",
                    units_sold=80 + pi * 29 + ci * 13,
                    searchable_text=f"{name} {subtitle} {sub} {cdef['name']}",
                    options=(
                        [{"name": "Size", "key": "size", "required": True, "values": FOOTWEAR_SIZES}]
                        if cdef["type"] == ProductType.FOOTWEAR else []
                    ),
                    is_active=True,
                )
                prods += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {cats} categories and {prods} products."))
