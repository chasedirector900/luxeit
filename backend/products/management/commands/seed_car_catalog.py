"""Seed the car-brand categories (Toyota, Nissan, ...), a universal car-parts
category, and their products — the backing data for the /category/<brand>
listing pages. Idempotent: safe to run repeatedly (keyed on slug).
"""
from django.core.management.base import BaseCommand

from products.models import Category, Product, ProductType, Warehouse, Origin, ShippingMethod


# Shared chrome for every car category (icon names match the frontend registry).
CHIPS = [
    {"key": "all", "label": "All", "icon": "Sparkles"},
    {"key": "engine", "label": "Engine", "icon": "Cog"},
    {"key": "brakes", "label": "Brakes", "icon": "Disc3"},
    {"key": "suspension", "label": "Suspension", "icon": "Wrench"},
    {"key": "filters", "label": "Filters", "icon": "Filter"},
    {"key": "electrical", "label": "Electrical", "icon": "Zap"},
    {"key": "lights", "label": "Lights", "icon": "Lightbulb"},
    {"key": "body", "label": "Body", "icon": "CarFront"},
]

FEATURES = [
    {"icon": "ShieldCheck", "title": "Fitment Checked", "subtitle": "Matched to your model", "tint": "text-emerald-500", "ring": "bg-emerald-500/10"},
    {"icon": "Truck", "title": "Fast Shipping", "subtitle": "China & Lusaka hubs", "tint": "text-sky-500", "ring": "bg-sky-500/10"},
    {"icon": "RotateCcw", "title": "Easy Returns", "subtitle": "Hassle-free returns", "tint": "text-violet-500", "ring": "bg-violet-500/10"},
]

# (sub_category, part name, price, original_price|None, from, to)
PART_TEMPLATES = [
    ("brakes", "Front Brake Pads", 38.99, 49.99, "#0a0a0a", "#d4af37"),
    ("brakes", "Brake Discs (Pair)", 89.99, None, "#2a1f03", "#b8860b"),
    ("filters", "Air Filter", 12.99, None, "#1a1305", "#f8e7a1"),
    ("filters", "Oil Filter (3-Pack)", 21.99, 27.99, "#241b02", "#8f6a09"),
    ("engine", "Iridium Spark Plugs", 44.99, None, "#4a3705", "#dfbb48"),
    ("engine", "Timing Belt Kit", 79.99, None, "#151005", "#e9c95f"),
    ("suspension", "Shock Absorbers (Pair)", 119.99, 149.99, "#0a0a0a", "#6b5007"),
    ("suspension", "Lower Control Arm", 64.99, None, "#2a1f03", "#d4af37"),
    ("electrical", "Battery 12V", 74.99, 89.99, "#1a1305", "#b8860b"),
    ("electrical", "Alternator", 129.99, None, "#241b02", "#f8e7a1"),
    ("lights", "LED Headlight", 134.99, None, "#4a3705", "#8f6a09"),
    ("body", "Side Mirror", 54.99, 69.99, "#151005", "#dfbb48"),
]

BRANDS = [
    {"slug": "toyota", "name": "Toyota", "models": ["Corolla", "Hilux", "RAV4", "Vitz"]},
    {"slug": "nissan", "name": "Nissan", "models": ["Navara", "X-Trail", "March", "Hardbody"]},
    {"slug": "honda", "name": "Honda", "models": ["Fit", "CR-V", "Civic"]},
    {"slug": "mazda", "name": "Mazda", "models": ["Demio", "CX-5", "BT-50"]},
    {"slug": "isuzu", "name": "Isuzu", "models": ["D-Max", "KB", "MU-X"]},
    {"slug": "ford", "name": "Ford", "models": ["Ranger", "Everest", "Focus"]},
]

# (sub_category, name, price, original|None, from, to)
UNIVERSAL_PARTS = [
    ("lights", "LED Headlight Bulbs H4/H7", 16.99, None, "#0a0a0a", "#e9c95f"),
    ("body", "Wiper Blade Set", 12.99, None, "#2a1f03", "#6b5007"),
    ("body", "Universal Seat Covers", 34.99, 44.99, "#1a1305", "#d4af37"),
    ("electrical", "Car Phone Holder", 9.99, None, "#241b02", "#b8860b"),
    ("electrical", "Dash Cam 1080p", 39.99, 54.99, "#4a3705", "#f8e7a1"),
    ("filters", "Cabin Air Freshener (5-Pack)", 7.99, None, "#151005", "#8f6a09"),
]


def slugify(*parts: str) -> str:
    return "-".join(parts).lower().replace(" ", "-").replace("(", "").replace(")", "").replace("/", "-")


def air_of(price: float) -> float:
    # Air freight runs ~45% above the sea price.
    return round(price * 1.45, 2)


class Command(BaseCommand):
    help = "Seed car-brand categories, a universal car-parts category, and products."

    def handle(self, *args, **options):
        cats = 0
        prods = 0

        for idx, brand in enumerate(BRANDS):
            category, _ = Category.objects.update_or_create(
                slug=brand["slug"],
                defaults={
                    "name": f"{brand['name']} Parts",
                    "blurb": f"Genuine & quality aftermarket parts for {brand['name']} vehicles",
                    "subtitle": f"Genuine & quality parts for {brand['name']} vehicles",
                    "search_placeholder": f"Search {brand['name']} parts...",
                    "hero": {
                        "badge": brand["name"],
                        "title": f"{brand['name']} Parts & Spares",
                        "subtitle": "For " + ", ".join(brand["models"]) + " and more",
                    },
                    "chips": CHIPS,
                    "features": FEATURES,
                    "ordering": 10 + idx,
                    "is_active": True,
                },
            )
            cats += 1

            for pidx, (sub, name, price, original, c_from, c_to) in enumerate(PART_TEMPLATES):
                model = brand["models"][pidx % len(brand["models"])]
                title = f"{model} {name}"
                Product.objects.update_or_create(
                    slug=slugify(brand["slug"], model, name),
                    defaults={
                        "title": title,
                        "product_type": ProductType.CAR_PART,
                        "category": category,
                        "sub_category": sub,
                        "subtitle": f"Fits {brand['name']} {model}",
                        "price": price,
                        "original_price": original,
                        "air_price": air_of(price),
                        "warehouse": Warehouse.CHINA,
                        "origin": Origin.CHINA,
                        "shipping_method": ShippingMethod.SEA,
                        "delivery_estimate": "10-18 days",
                        "import_tag": "China import",
                        "units_sold": 120 + pidx * 37 + idx * 11,
                        "compatibility": {
                            "title": "Vehicle fitment",
                            "fields": [
                                {"key": "make", "label": "Make", "values": [brand["name"]]},
                                {"key": "model", "label": "Model", "values": [model]},
                            ],
                            "note": f"Confirmed fit for {brand['name']} {model}.",
                        },
                        "searchable_text": f"{brand['name']} {model} {name} {sub} car part",
                        "is_active": True,
                    },
                )
                prods += 1

        # Universal car parts — fit most vehicles.
        universal, _ = Category.objects.update_or_create(
            slug="universal-car-parts",
            defaults={
                "name": "Universal Car Parts",
                "blurb": "Parts and accessories that fit most vehicles",
                "subtitle": "Accessories and parts that fit most vehicles",
                "search_placeholder": "Search universal car parts...",
                "hero": {
                    "badge": "Universal",
                    "title": "Universal Car Parts",
                    "subtitle": "One fit for many makes and models",
                },
                "chips": CHIPS,
                "features": FEATURES,
                "ordering": 9,
                "is_active": True,
            },
        )
        cats += 1
        for pidx, (sub, name, price, original, c_from, c_to) in enumerate(UNIVERSAL_PARTS):
            Product.objects.update_or_create(
                slug=slugify("universal", name),
                defaults={
                    "title": name,
                    "product_type": ProductType.CAR_PART,
                    "category": universal,
                    "sub_category": sub,
                    "subtitle": "Universal fit",
                    "price": price,
                    "original_price": original,
                    "air_price": air_of(price),
                    "warehouse": Warehouse.CHINA,
                    "origin": Origin.CHINA,
                    "shipping_method": ShippingMethod.SEA,
                    "delivery_estimate": "10-18 days",
                    "import_tag": "China import",
                    "units_sold": 400 + pidx * 53,
                    "searchable_text": f"universal {name} {sub} car part accessory",
                    "is_active": True,
                },
            )
            prods += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {cats} categories and {prods} products."))
