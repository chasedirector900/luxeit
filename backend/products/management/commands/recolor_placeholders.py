import re

from django.core.management.base import BaseCommand

from products.models import Product, ProductImage

# Old seeder palettes (indigo/sky/rose/teal/…) mapped onto the LUXE iT gold
# scale. Dark bases go to near-black/deep gold; bright stops go to a gold.
COLOUR_MAP = {
    # dark gradient bases
    "#1e1b4b": "#0a0a0a", "#0c4a6e": "#2a1f03", "#451a03": "#1a1305",
    "#134e4a": "#241b02", "#4c0519": "#4a3705", "#3b0764": "#151005",
    "#052e16": "#0a0a0a", "#1c1917": "#2a1f03", "#422006": "#1a1305",
    "#27272a": "#241b02", "#1e293b": "#151005", "#0f172a": "#0a0a0a",
    # bright gradient stops
    "#4338ca": "#d4af37", "#0ea5e9": "#b8860b", "#b45309": "#f8e7a1",
    "#14b8a6": "#8f6a09", "#e11d48": "#dfbb48", "#a855f7": "#e9c95f",
    "#16a34a": "#d4af37", "#52525b": "#6b5007", "#dc2626": "#d4af37",
    "#57534e": "#b8860b", "#a16207": "#f8e7a1", "#f59e0b": "#dfbb48",
    "#71717a": "#8f6a09", "#64748b": "#6b5007", "#38bdf8": "#e9c95f",
}

# Colours are URL-encoded inside the data-URI ("#" -> "%23").
_PATTERN = re.compile("|".join(re.escape(c) for c in COLOUR_MAP), re.IGNORECASE)


def _recolour(value: str) -> str:
    """Swap old palette colours for gold, leaving the rest of the SVG intact."""
    if not value:
        return value
    decoded = value.replace("%23", "#")
    swapped = _PATTERN.sub(lambda m: COLOUR_MAP[m.group(0).lower()], decoded)
    return swapped.replace("#", "%23") if "%23" in value else swapped


class Command(BaseCommand):
    help = (
        "Recolour existing placeholder product images onto the brand gold palette. "
        "Non-destructive: updates the image fields in place, so reviews, saved "
        "items, recommendation events and order history are all preserved "
        "(unlike re-running the seeders, which delete and recreate products)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing anything.",
        )

    def handle(self, *args, **options):
        dry = options["dry_run"]

        products = [p for p in Product.objects.all() if p.image]
        changed = [p for p in products if _recolour(p.image) != p.image]
        for p in changed:
            p.image = _recolour(p.image)
        if changed and not dry:
            Product.objects.bulk_update(changed, ["image"])

        gallery = [g for g in ProductImage.objects.all() if g.src]
        g_changed = [g for g in gallery if _recolour(g.src) != g.src]
        for g in g_changed:
            g.src = _recolour(g.src)
        if g_changed and not dry:
            ProductImage.objects.bulk_update(g_changed, ["src"])

        verb = "Would recolour" if dry else "Recoloured"
        self.stdout.write(
            self.style.SUCCESS(
                f"{verb} {len(changed)}/{len(products)} product thumbnails and "
                f"{len(g_changed)}/{len(gallery)} gallery images."
            )
        )
