"""Personalised feed, interaction tracking, and search-term endpoints.

The feed rotates every reload (via ?seed) and personalises for signed-in users;
events/searches are recorded only for authenticated users (personalisation needs
identity). All public reads are AllowAny so logged-out visitors still get a good
popularity-driven feed.
"""
from django.db.models import Count
from rest_framework import status as http_status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from api.throttling import WriteOnlyUserRateThrottle

from .models import Product, ProductEvent, SearchQuery
from .recommendations import recommend
from .serializers import ProductListSerializer

RECENT_SEARCH_LIMIT = 8
POPULAR_SEARCH_LIMIT = 8
# A sensible default so the global "popular searches" isn't empty before there's
# much history — replaced by real data as searches accumulate.
POPULAR_FALLBACK = ["Car parts", "Watches", "Security camera", "Sneakers", "Phone", "LED headlights"]


class EventThrottle(WriteOnlyUserRateThrottle):
    scope = "events"


@api_view(["GET"])
@permission_classes([AllowAny])
def feed(request):
    """GET /api/feed?seed=&limit=&category=&exclude=slug,slug — the personalised,
    rotated product feed. Personalises when signed in; popularity + freshness for
    everyone else."""
    seed = request.query_params.get("seed", "")
    try:
        limit = min(max(int(request.query_params.get("limit", 12)), 1), 60)
    except (TypeError, ValueError):
        limit = 12
    category = request.query_params.get("category") or None
    exclude = [s for s in (request.query_params.get("exclude", "").split(",")) if s]

    user = request.user if request.user.is_authenticated else None
    products = recommend(user, limit=limit, seed=seed, category_slug=category, exclude_slugs=exclude)
    return Response(ProductListSerializer(products, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([EventThrottle])
def record_event(request):
    """POST /api/events {slug, kind} — record a view or add-to-cart so the feed
    learns. Silently ignores unknown products (never blocks the UI)."""
    slug = str(request.data.get("slug") or "").strip()
    kind = request.data.get("kind") if request.data.get("kind") in (ProductEvent.VIEW, ProductEvent.CART) else ProductEvent.VIEW
    product = Product.objects.filter(slug=slug, is_active=True).only("id").first()
    if product is not None:
        ProductEvent.objects.create(user=request.user, product=product, kind=kind)
    return Response(status=http_status.HTTP_204_NO_CONTENT)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def searches(request):
    """GET: {recent (per signed-in user), popular (global)} search terms.
    POST {term}: record a search (signed-in users only)."""
    if request.method == "POST":
        if not request.user.is_authenticated:
            return Response(status=http_status.HTTP_204_NO_CONTENT)
        term = str(request.data.get("term") or "").strip()[:120]
        if term:
            # De-dupe: keep one recent row per term (most recent wins).
            SearchQuery.objects.filter(user=request.user, term__iexact=term).delete()
            SearchQuery.objects.create(user=request.user, term=term)
        return Response(status=http_status.HTTP_204_NO_CONTENT)

    recent = []
    if request.user.is_authenticated:
        seen = set()
        for q in SearchQuery.objects.filter(user=request.user)[:30]:
            key = q.term.lower()
            if key not in seen:
                seen.add(key)
                recent.append(q.term)
            if len(recent) >= RECENT_SEARCH_LIMIT:
                break

    popular = list(
        SearchQuery.objects.values("term")
        .annotate(n=Count("id"))
        .order_by("-n")[:POPULAR_SEARCH_LIMIT]
        .values_list("term", flat=True)
    )
    # Top up with sensible defaults until real search history builds.
    for term in POPULAR_FALLBACK:
        if len(popular) >= POPULAR_SEARCH_LIMIT:
            break
        if term.lower() not in {p.lower() for p in popular}:
            popular.append(term)

    return Response({"recent": recent, "popular": popular})
