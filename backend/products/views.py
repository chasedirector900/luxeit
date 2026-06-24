from django.db.models import Q
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from .models import Category, Product
from .serializers import (
    CategoryListingSerializer,
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


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
