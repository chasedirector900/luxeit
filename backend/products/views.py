from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status as http_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Category, Product, ProductReview
from .serializers import (
    CategoryListingSerializer,
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


def _user_has_purchased(user, product) -> bool:
    """True if the user has a DELIVERED order containing this product — you can
    only review what you've received. Imported lazily to dodge a circular import."""
    from orders.models import OrderItem, OrderStatus

    return OrderItem.objects.filter(
        order__user=user, product=product, order__status=OrderStatus.DELIVERED
    ).exists()


class CategoryListView(ListAPIView):
    """GET /api/categories/ — active shop categories."""

    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(is_active=True)


class CategoryDetailView(RetrieveAPIView):
    """GET /api/categories/<slug>/ — full listing payload (chrome + products)."""

    permission_classes = [AllowAny]
    serializer_class = CategoryListingSerializer
    lookup_field = "slug"
    queryset = Category.objects.filter(is_active=True).prefetch_related("products")


class ProductListView(ListAPIView):
    """GET /api/products/ — filterable product list.

    Query params: ?category=<slug> &type=<product_type> &warehouse=<china|zambia>
    &sub=<sub_category> &q=<search>
    """

    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related("category")
        params = self.request.query_params

        if category := params.get("category"):
            qs = qs.filter(category__slug=category)
        if product_type := params.get("type"):
            qs = qs.filter(product_type=product_type)
        if warehouse := params.get("warehouse"):
            qs = qs.filter(warehouse=warehouse)
        if sub := params.get("sub"):
            qs = qs.filter(sub_category=sub)
        if q := params.get("q"):
            qs = qs.filter(Q(title__icontains=q) | Q(searchable_text__icontains=q))
        return qs


class ProductDetailView(RetrieveAPIView):
    """GET /api/products/<slug>/ — full product detail with reviews."""

    permission_classes = [AllowAny]
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"
    queryset = (
        Product.objects.filter(is_active=True)
        .select_related("category")
        .prefetch_related("images", "reviews")
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def product_review(request, slug):
    """The signed-in user's own review for a product.

    GET  -> { canReview, hasReviewed, review|null } (eligibility = bought it).
    POST -> create/update the user's review. 403 unless they purchased it.
    Only one review per user per product; re-posting updates it.
    """
    product = get_object_or_404(Product.objects.filter(is_active=True), slug=slug)
    purchased = _user_has_purchased(request.user, product)
    existing = ProductReview.objects.filter(product=product, user=request.user).first()

    if request.method == "GET":
        review = None
        if existing:
            review = {"rating": existing.rating, "text": existing.text, "date": existing.date.isoformat()}
        return Response({"canReview": purchased, "hasReviewed": bool(existing), "review": review})

    # POST
    if not purchased:
        return Response(
            {"detail": "You can only review products you've bought."},
            status=http_status.HTTP_403_FORBIDDEN,
        )
    try:
        rating = int(request.data.get("rating"))
    except (TypeError, ValueError):
        rating = 0
    if rating < 1 or rating > 5:
        return Response({"detail": "Rating must be between 1 and 5."}, status=http_status.HTTP_400_BAD_REQUEST)
    text = str(request.data.get("text") or "").strip()[:2000]

    name = request.user.public_display_name
    review, _ = ProductReview.objects.update_or_create(
        product=product,
        user=request.user,
        defaults={
            "user_name": name,
            "avatar_initial": name[:1].upper(),
            "rating": rating,
            "text": text,
            "verified": True,
            "date": timezone.now().date(),
        },
    )
    product.recalculate_ratings()

    # Alert the team the moment a review BECOMES bad (not on every edit of one).
    from .services import BAD_RATING_MAX, alert_staff_bad_review

    was_bad = existing is not None and existing.rating <= BAD_RATING_MAX
    if rating <= BAD_RATING_MAX and not was_bad:
        alert_staff_bad_review(review, request=request)
    return Response(
        {"ok": True, "review": {"rating": review.rating, "text": review.text, "date": review.date.isoformat()}},
        status=http_status.HTTP_201_CREATED,
    )
