"""Seed believable customer reviews for the car-part products so each product
shows a ratings breakdown, review tags and individual reviews. Idempotent:
re-running clears a product's reviews and recreates them deterministically.
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
    "Fitted perfectly and works great. Delivery to Lusaka was faster than I expected.",
    "Exactly as described. Good quality for the price — very happy with this purchase.",
    "Genuine fit for my car. Packaging was solid and nothing arrived damaged.",
    "Been using it for a few weeks now with no issues at all. Will order again.",
    "Great value. Shipping from China took about two weeks but it was worth the wait.",
    "Solid build quality and matches the original part well. Recommended.",
    "Easy to install and feels well made. Exactly what I needed.",
]
NEUTRAL = [
    "Works fine but delivery took a little longer than expected.",
    "Decent part for the price. Installation needed a bit of effort.",
    "Good enough for what I paid. Does the job well.",
]
TAGS = ["Great Quality", "Good Value", "As Described", "Fast Delivery", "Perfect Fit", "Well Packaged"]

REPLY = "Thanks for the feedback! Glad it fit your vehicle. — LUXEIT Support"


class Command(BaseCommand):
    help = "Seed fake reviews for car-part products."

    def handle(self, *args, **options):
        products = Product.objects.filter(product_type=ProductType.CAR_PART)
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
                    date=timezone.now().date() - timedelta(days=rng.randint(3, 180)),
                    helpful_count=rng.randint(0, 18),
                )
                if i == 0 and rng.random() < 0.4:
                    review.reply_text = REPLY
                    review.reply_author = "LUXEIT Support"
                    review.save()  # save() auto-stamps reply_date
                total += 1

            # Review tag chips with counts.
            chosen = rng.sample(TAGS, rng.randint(3, 5))
            product.review_tags = [{"label": label, "count": rng.randint(40, 320)} for label in chosen]
            product.save(update_fields=["review_tags"])
            product.recalculate_ratings()

        self.stdout.write(self.style.SUCCESS(f"Seeded {total} reviews across {products.count()} products."))
