from django.contrib import admin

from .models import Category, Product, ProductImage, ProductReview


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    min_num = 1  # business rule: thumbnail (the `image` field) + at least one gallery image
    fields = ("src", "alt", "object_fit", "position")


class ProductReviewInline(admin.TabularInline):
    model = ProductReview
    extra = 0
    fields = ("user_name", "rating", "text", "date", "helpful_count", "reply_text")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "ordering", "is_active")
    list_editable = ("ordering", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "product_type", "category", "warehouse", "price", "units_sold", "rating_average", "is_active")
    list_filter = ("product_type", "warehouse", "category", "is_active", "origin")
    search_fields = ("title", "slug", "searchable_text")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("category",)
    inlines = [ProductImageInline, ProductReviewInline]
    readonly_fields = ("rating_average", "rating_count", "rating_breakdown", "created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("title", "slug", "product_type", "category", "sub_category", "description", "is_active")}),
        ("Pricing", {"fields": ("price", "original_price", "air_price"), "description": "China hub: 'price' is the sea price; set 'air price' to also offer faster air freight."}),
        ("Fulfilment hub", {"fields": ("warehouse", "origin", "shipping_method", "delivery_estimate", "import_tag", "preorder")}),
        ("Media", {"fields": ("image", "video", "video_thumbnail"), "description": "Thumbnail is required; add gallery images below. Video is optional."}),
        ("Sales & search", {"fields": ("units_sold", "searchable_text")}),
        ("Type-specific content", {"classes": ("collapse",), "fields": ("options", "spec_groups", "compatibility", "package_contents", "notices", "review_tags")}),
        ("Ratings (auto)", {"fields": ("rating_average", "rating_count", "rating_breakdown")}),
        ("Timestamps", {"classes": ("collapse",), "fields": ("created_at", "updated_at")}),
    )

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        # Keep aggregate ratings in sync after inline reviews are saved.
        form.instance.recalculate_ratings()


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "position", "alt", "object_fit")
    list_filter = ("object_fit",)
    search_fields = ("product__title", "alt")


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ("user_name", "product", "rating", "date", "helpful_count", "has_reply")
    list_filter = ("rating",)
    search_fields = ("user_name", "text", "product__title")
    fieldsets = (
        ("Review", {"fields": ("product", "user", "user_name", "avatar_initial", "rating", "text", "date", "helpful_count", "images")}),
        ("LUXEIT reply", {"fields": ("reply_text", "reply_author", "reply_date"), "description": "Type a reply to respond publicly. The date auto-fills."}),
    )

    @admin.display(boolean=True, description="Replied")
    def has_reply(self, obj):
        return bool(obj.reply_text)
