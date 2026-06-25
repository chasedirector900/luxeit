"""Seed believable customer reviews for every physical product so each shows a
ratings breakdown, review tags and individual reviews. Idempotent: re-running
clears a product's reviews and recreates them deterministically.
"""
import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from products.models import Product, ProductReview, ProductType

NAMES = [
    "Chisomo", "Mwansa", "Natasha", "Bwalya", "Tariro", "Kunda", "Mutale",
    "Chanda", "Temba", "Mapalo", "Nchimunya", "Thandiwe", "Lubona", "Sefu",
    "Mulenga", "Kabwe", "Nasilele", "Chipo",
]

POSITIVE = [
    "Exactly as described and great quality. Delivery to Lusaka was quick.",
    "Really happy with this — good value for the price. Would buy again.",
    "Solid build and works perfectly. Packaging was secure, nothing damaged.",
    "Been using it for a few weeks now with zero issues. Recommended.",
    "Great find. Shipping from China took a couple of weeks but worth it.",
    "Looks even better in person. Matches the photos well.",
    "Easy to set up and does exactly what I needed.",
]
NEUTRAL = [
    "Works fine but delivery took a little longer than expected.",
    "Decent for the price. Nothing fancy but it does the job.",
    "Good enough. Setup needed a bit of patience.",
]
TAGS = ["Great Quality", "Good Value", "As Described", "Fast Delivery", "Perfect Fit", "Well Packaged"]
REPLY = "Thanks for the feedback! Glad you're happy with it. — LUXEIT Support"


class Command(BaseCommand):
    help = "Seed fake reviews for all physical products."

    def handle(self, *args, **options):
        products = Product.objects.filter(is_active=True).exclude(product_type=ProductType.DIGITAL)
        total = 0
        for product in products:
            rng = random.Random(product.id)  # deterministic per product
            product.reviews.all().delete()   # idempotent reseed

            count = rng.randint(3, 6)
            names = rng.sample(NAMES, count)
            for i in range(count):
                rating = rng.choices([5, 4, 3], weights=[6, 3, 1])[0]
                text = rng.choice(POSITIVE if rating >= 4 else NEUTRAL)
                name = names[i]
                review = ProductReview.objects.create(
                    product=product,
                    user_name=name,
                    avatar_initial=name[0],
                    rating=rating,
                    text=text,
                    verified=True,
                    date=timezone.now().date() - timedelta(days=rng.randint(3, 180)),
                    helpful_count=rng.randint(0, 18),
                )
                if i == 0 and rng.random() < 0.4:
                    review.reply_text = REPLY
                    review.reply_author = "LUXEIT Support"
                    review.save()

            chosen = rng.sample(TAGS, rng.randint(3, 5))
            product.review_tags = [{"label": label, "count": rng.randint(40, 320)} for label in chosen]
            product.save(update_fields=["review_tags"])
            product.recalculate_ratings()
            total += count

        self.stdout.write(self.style.SUCCESS(f"Seeded {total} reviews across {products.count()} products."))
