"""Serializers that emit the same JSON shape the frontend `Product` type expects
(camelCase keys, optional fields omitted when empty), so the Next.js app can
swap its mock data for this API without reshaping.
"""
from rest_framework import serializers

from .models import Category, Product, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["slug", "name", "blurb"]


class ListingProductSerializer(serializers.BaseSerializer):
    """The lightweight `ListingProduct` shape the category listing pages use."""

    def to_representation(self, obj: Product) -> dict:
        data = {
            "id": str(obj.id),
            "slug": obj.slug,
            "title": obj.title,
            "subtitle": obj.subtitle,
            "subCategory": obj.sub_category or "all",
            "price": float(obj.price),
            "image": obj.image,
        }
        if obj.original_price is not None and obj.original_price > obj.price:
            data["originalPrice"] = float(obj.original_price)
            pct = round((1 - float(obj.price) / float(obj.original_price)) * 100)
            data["badge"] = {"label": f"-{pct}%", "tone": "sale"}
        return data


class CategoryListingSerializer(serializers.BaseSerializer):
    """Full listing-page payload: category chrome + its products, matching the
    frontend `CategoryConfig` so the page can render straight from the API."""

    def to_representation(self, category: Category) -> dict:
        products = [
            p for p in category.products.all() if p.is_active
        ]
        return {
            "slug": category.slug,
            "title": category.name,
            "subtitle": category.subtitle,
            "searchPlaceholder": category.search_placeholder or f"Search {category.name}...",
            "hero": category.hero or {"badge": category.name, "title": category.name, "subtitle": category.blurb},
            "chips": category.chips or [{"key": "all", "label": "All", "icon": "Sparkles"}],
            "features": category.features or [],
            "products": [ListingProductSerializer(p).data for p in products],
        }


def _sold_label(n: int) -> str:
    """Humanise the units-sold count for the frontend 'X sold' label."""
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M".replace(".0M", "M")
    if n >= 1_000:
        return f"{n / 1_000:.1f}k".replace(".0k", "k")
    return str(n)


def _media(product: Product) -> list:
    """Assemble the frontend media array: thumbnail first, then gallery, then video."""
    items: list[dict] = []
    if product.image:
        items.append({"type": "image", "src": product.image, "alt": product.title, "objectFit": "contain"})
    for img in product.images.all():
        items.append(
            {"type": "image", "src": img.src, "alt": img.alt or product.title, "objectFit": img.object_fit}
        )
    if product.video:
        video = {"type": "video", "src": product.video, "title": f"{product.title} video"}
        if product.video_thumbnail:
            video["thumbnail"] = product.video_thumbnail
        items.append(video)
    return items


def _review_dict(review: ProductReview) -> dict:
    data = {
        "id": str(review.id),
        "userName": review.user_name,
        "rating": review.rating,
        "date": review.date.isoformat(),
        "text": review.text,
        "helpfulCount": review.helpful_count,
        "verified": review.verified,
    }
    if review.avatar_initial:
        data["avatarInitial"] = review.avatar_initial
    if review.avatar_url:
        data["avatarUrl"] = review.avatar_url
    if review.images:
        data["images"] = review.images
    if review.reply_text:
        data["sellerReply"] = {
            "author": review.reply_author or "LUXEIT Support",
            "date": review.reply_date.isoformat() if review.reply_date else "",
            "text": review.reply_text,
        }
    return data


class ProductListSerializer(serializers.BaseSerializer):
    """Lightweight shape for product cards / listings."""

    def to_representation(self, obj: Product) -> dict:
        data = {
            "id": str(obj.id),
            "slug": obj.slug,
            "title": obj.title,
            "image": obj.image,
            "price": float(obj.price),
            "productType": obj.product_type,
            "ratingAverage": float(obj.rating_average),
            "ratingCount": obj.rating_count,
        }
        if obj.original_price is not None:
            data["originalPrice"] = float(obj.original_price)
        if obj.category_id:
            data["category"] = obj.category.name
        if obj.units_sold:
            data["popularityLabel"] = _sold_label(obj.units_sold)
        for src, key in (
            ("warehouse", "warehouse"),
            ("delivery_estimate", "deliveryEstimate"),
            ("shipping_method", "shippingMethod"),
            ("origin", "origin"),
            ("import_tag", "importTag"),
        ):
            value = getattr(obj, src)
            if value:
                data[key] = value
        if obj.preorder:
            data["preorder"] = True
        return data


class ProductDetailSerializer(serializers.BaseSerializer):
    """Full Product shape used by the product-detail + reviews screens."""

    def to_representation(self, obj: Product) -> dict:
        data = {
            "id": str(obj.id),
            "slug": obj.slug,
            "title": obj.title,
            "image": obj.image,
            "media": _media(obj),
            "price": float(obj.price),
            "productType": obj.product_type,
            "unitsSold": obj.units_sold,
        }
        if obj.category_id:
            data["category"] = obj.category.name
            data["categorySlug"] = obj.category.slug
        if obj.description:
            data["description"] = obj.description
        if obj.original_price is not None:
            data["originalPrice"] = float(obj.original_price)
        if obj.units_sold:
            data["popularityLabel"] = _sold_label(obj.units_sold)

        # Optional scalar fields — only included when set.
        for src, key in (
            ("warehouse", "warehouse"),
            ("origin", "origin"),
            ("shipping_method", "shippingMethod"),
            ("delivery_estimate", "deliveryEstimate"),
            ("import_tag", "importTag"),
            ("searchable_text", "searchableText"),
        ):
            value = getattr(obj, src)
            if value:
                data[key] = value
        if obj.preorder:
            data["preorder"] = True

        # Type-specific structured content.
        if obj.options:
            data["options"] = obj.options
        if obj.spec_groups:
            data["specGroups"] = obj.spec_groups
        if obj.compatibility:
            data["compatibility"] = obj.compatibility
        if obj.package_contents:
            data["packageContents"] = obj.package_contents
        if obj.notices:
            data["notices"] = obj.notices

        # Ratings block (aggregates + tags + reviews).
        reviews = list(obj.reviews.all())
        if obj.rating_count or reviews:
            data["ratings"] = {
                "ratingAverage": float(obj.rating_average),
                "ratingCount": obj.rating_count,
                "ratingBreakdown": obj.rating_breakdown or {str(s): 0 for s in range(1, 6)},
                "reviewTags": obj.review_tags,
                "reviews": [_review_dict(r) for r in reviews],
            }
        return data
