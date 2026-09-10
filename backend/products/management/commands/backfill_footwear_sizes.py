"""One-off backfill: give existing footwear products a default Size option.

The guided "Add product" admin form didn't expose sizes before 2026-09-10, so
every footwear product added before then has no `options` set and shows no
size picker. Run this once after deploying the sizes feature; new footwear
products get their sizes from the add form going forward. Safe to re-run —
products that already have a "size" option are left alone.
"""
from django.core.management.base import BaseCommand

from products.models import Product, ProductType

DEFAULT_SIZES = [str(n) for n in range(38, 46)]  # EU 38-45


class Command(BaseCommand):
    help = "Backfill a default Size option onto footwear products that don't already have one."

    def handle(self, *args, **options):
        updated = skipped = 0
        for product in Product.objects.filter(product_type=ProductType.FOOTWEAR):
            existing = product.options or []
            if any(isinstance(o, dict) and o.get("key") == "size" for o in existing):
                skipped += 1
                continue
            product.options = existing + [{
                "name": "Size",
                "key": "size",
                "required": True,
                "values": DEFAULT_SIZES,
            }]
            product.save(update_fields=["options"])
            updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"Backfilled sizes on {updated} footwear product(s); {skipped} already had a size option."
        ))
