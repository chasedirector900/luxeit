"""Luxeit's recommendation engine.

Content-based + popularity + freshness, with a seeded exploration term so the
feed rotates on every reload (YouTube-style) without becoming random. It learns
from real behaviour — purchases, saves, reviews, views and searches — building a
per-user affinity for the categories and product types they engage with, then
scores the catalogue.

This is the right algorithm for the current data scale. When there's enough
interaction volume for collaborative filtering, only `score_products` changes;
the tracking, endpoints and API stay the same.
"""
import hashlib
import math
from collections import defaultdict

from django.utils import timezone

from .models import Product, ProductEvent, SavedItem

# How much each kind of signal says about what a customer likes.
SIGNAL_WEIGHTS = {
    "purchase": 5.0,
    "save": 3.0,
    "review": 2.5,
    "cart": 2.0,
    "view": 1.0,
    "search": 1.5,
}
# Only the recent past shapes taste; older signals fade (half-life in days).
AFFINITY_HALFLIFE_DAYS = 30.0
# How strongly personalisation, popularity, freshness and exploration each pull.
W_AFFINITY = 3.0
W_POPULARITY = 1.0
W_FRESHNESS = 0.6
W_EXPLORATION = 0.8


def _decay(days: float) -> float:
    return 0.5 ** (days / AFFINITY_HALFLIFE_DAYS)


def affinity_profile(user) -> dict:
    """Weighted taste vector over (category_id, product_type) from the user's
    recent behaviour. Empty for anonymous or brand-new users (cold start)."""
    if user is None or not getattr(user, "is_authenticated", False):
        return {"category": {}, "type": {}}

    now = timezone.now()
    cat: dict = defaultdict(float)
    typ: dict = defaultdict(float)

    def add(product_category_id, product_type, weight, when):
        d = _decay((now - when).total_seconds() / 86400.0) if when else 1.0
        if product_category_id:
            cat[product_category_id] += weight * d
        if product_type:
            typ[product_type] += weight * d

    # Purchases (strongest signal).
    from orders.models import OrderItem

    for it in OrderItem.objects.filter(order__user=user, product__isnull=False).select_related("product")[:200]:
        add(it.product.category_id, it.product.product_type, SIGNAL_WEIGHTS["purchase"], it.order.placed_at)
    # Saves.
    for s in SavedItem.objects.filter(user=user).select_related("product")[:200]:
        add(s.product.category_id, s.product.product_type, SIGNAL_WEIGHTS["save"], s.created_at)
    # Reviews.
    for r in user.product_reviews.select_related("product").all()[:200]:
        if r.product_id:
            add(r.product.category_id, r.product.product_type, SIGNAL_WEIGHTS["review"], r.created_at)
    # Views / add-to-cart.
    for e in ProductEvent.objects.filter(user=user).select_related("product")[:400]:
        w = SIGNAL_WEIGHTS.get(e.kind, SIGNAL_WEIGHTS["view"])
        add(e.product.category_id, e.product.product_type, w, e.created_at)

    return {"category": dict(cat), "type": dict(typ)}


def _seed_jitter(seed: str, product_id: int) -> float:
    """Deterministic pseudo-random in [0,1) from (seed, product) — the same seed
    gives the same order, a new seed reshuffles. Drives per-reload rotation."""
    h = hashlib.md5(f"{seed}:{product_id}".encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def score_products(products, profile, *, seed="", now=None):
    """Score each product: personalisation + popularity + freshness + a seeded
    exploration nudge. Returns [(product, score)] unsorted."""
    now = now or timezone.now()
    cat_w = profile.get("category", {})
    typ_w = profile.get("type", {})
    max_cat = max(cat_w.values(), default=0.0)
    max_typ = max(typ_w.values(), default=0.0)
    # Popularity is normalised against the busiest seller so it stays 0..1.
    max_sold = max((p.units_sold for p in products), default=0) or 1

    scored = []
    for p in products:
        affinity = 0.0
        if max_cat:
            affinity += 0.6 * (cat_w.get(p.category_id, 0.0) / max_cat)
        if max_typ:
            affinity += 0.4 * (typ_w.get(p.product_type, 0.0) / max_typ)

        popularity = 0.5 * (p.units_sold / max_sold) + 0.5 * (float(p.rating_average) / 5.0)
        age_days = max((now - p.created_at).total_seconds() / 86400.0, 0.0)
        freshness = math.exp(-age_days / 45.0)  # newer listings surface a little
        exploration = _seed_jitter(seed, p.pk)

        score = (
            W_AFFINITY * affinity
            + W_POPULARITY * popularity
            + W_FRESHNESS * freshness
            + W_EXPLORATION * exploration
        )
        scored.append((p, score))
    return scored


def _diversify(scored, limit):
    """Spread the feed across categories instead of letting whichever one has
    the most (or the freshest) listings crowd everything else out — e.g. a
    bulk upload of 20 watches shouldn't fill the whole home feed with watches.
    Round-robins the best remaining item from each category, category order
    itself set by that category's current top score, so personalisation still
    decides which category goes first — it just can't take every slot."""
    by_category: dict = defaultdict(list)
    for p, score in sorted(scored, key=lambda pair: pair[1], reverse=True):
        by_category[p.category_id].append((p, score))

    result = []
    while len(result) < limit and by_category:
        # Re-rank remaining categories by their current best score each round,
        # so a category that ran out drops away and doesn't skip its turn.
        for cat_id in sorted(by_category, key=lambda c: by_category[c][0][1], reverse=True):
            if len(result) >= limit:
                break
            bucket = by_category[cat_id]
            result.append(bucket.pop(0))
            if not bucket:
                del by_category[cat_id]
    return [p for p, _ in result]


def recommend(user, *, limit=12, seed="", category_slug=None, exclude_slugs=None):
    """The ranked feed for a user. Personalised when signed in, popularity- and
    freshness-driven for cold start — always rotated by `seed`. Diversified
    across categories unless the caller already scoped to one."""
    qs = Product.objects.filter(is_active=True).select_related("category")
    if category_slug:
        qs = qs.filter(category__slug=category_slug)
    if exclude_slugs:
        qs = qs.exclude(slug__in=list(exclude_slugs))

    products = list(qs[:500])  # bounded candidate set
    if not products:
        return []
    profile = affinity_profile(user)
    scored = score_products(products, profile, seed=seed)
    if category_slug:
        scored.sort(key=lambda pair: pair[1], reverse=True)
        return [p for p, _ in scored[:limit]]
    return _diversify(scored, limit)
