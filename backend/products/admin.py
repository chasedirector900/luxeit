from django.contrib import admin, messages
from django.db.models import Count
from django.shortcuts import redirect, render
from django.urls import path, reverse
from django.utils.html import format_html

from .forms import GuidedProductForm
from .models import Category, Product, ProductImage, ProductReview


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    min_num = 1  # business rule: thumbnail (the `image` field) + at least one gallery image
    fields = ("src_file", "src", "alt", "object_fit", "position")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "products_count", "ordering", "is_active")
    list_editable = ("ordering", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_products=Count("products"))

    @admin.display(description="Products", ordering="_products")
    def products_count(self, obj):
        url = reverse("admin:products_product_changelist")
        return format_html(
            '<a href="{}?category__id__exact={}">{} product{}</a>',
            url, obj.pk, obj._products, "" if obj._products == 1 else "s",
        )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Adding a product = the essentials only. Sales counters, ratings and
    review tags are app-managed and locked (shown read-only on existing
    products); customer reviews are moderated in their own section."""

    list_display = ("thumb", "title", "category", "warehouse", "price_display", "units_sold", "rating_average", "is_active")
    list_display_links = ("title",)
    list_filter = ("product_type", "warehouse", "category", "is_active", "origin")
    list_per_page = 25
    search_fields = ("title", "slug", "searchable_text")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("category",)
    inlines = [ProductImageInline]
    readonly_fields = ("units_sold", "rating_summary", "review_tags", "created_at", "updated_at")

    # What a staff member actually needs to put a product on sale.
    _ADD_FIELDSETS = (
        ("Product", {
            "fields": ("title", "slug", "category", "sub_category", "product_type", "subtitle", "description", "is_active"),
            "description": "Sub-category must match one of the category's chip keys (open the category to see them — e.g. sneakers, phones).",
        }),
        ("Pricing (ZMW)", {
            "fields": ("price", "original_price", "air_price"),
            "description": "China hub: 'price' is the SEA price; set 'air price' to also offer faster air freight. Prices include delivery.",
        }),
        ("Fulfilment", {
            "fields": ("warehouse", "origin", "delivery_estimate", "import_tag", "preorder"),
        }),
        ("Media", {
            "fields": ("image_file", "image", "video", "video_thumbnail"),
            "description": "Upload a thumbnail (stored in R2) or paste an image URL — one is required. Add gallery images below. Video is optional.",
        }),
        ("Extra details (optional)", {
            "classes": ("collapse",),
            "fields": ("options", "spec_groups", "compatibility", "package_contents", "notices", "searchable_text"),
        }),
    )
    # Existing products additionally show what the app manages — read-only.
    _APP_MANAGED_FIELDSET = (
        ("App-managed (read-only)", {
            "classes": ("collapse",),
            "fields": ("units_sold", "rating_summary", "review_tags", "created_at", "updated_at"),
            "description": "Updated automatically by the app: sales counters, customer ratings and timestamps. Not editable.",
        }),
    )

    def get_fieldsets(self, request, obj=None):
        return self._ADD_FIELDSETS if obj is None else self._ADD_FIELDSETS + self._APP_MANAGED_FIELDSET

    change_list_template = "admin/products/product/change_list.html"

    # ── Guided add: a plain-language form for non-technical staff ────────────
    def get_urls(self):
        custom = [
            path(
                "add-guided/",
                self.admin_site.admin_view(self.guided_add_view),
                name="products_product_add_guided",
            ),
        ]
        return custom + super().get_urls()

    def add_view(self, request, form_url="", extra_context=None):
        # The guided flow IS the default "Add product" — every add button lands
        # there. The full tabbed form stays reachable via ?advanced=1.
        if "advanced" not in request.GET:
            return redirect("admin:products_product_add_guided")
        return super().add_view(request, form_url, extra_context)

    def guided_add_view(self, request):
        if not self.has_add_permission(request):
            return redirect("admin:products_product_changelist")

        if request.method == "POST":
            form = GuidedProductForm(request.POST)
            if form.is_valid():
                product = form.save()
                self.message_user(request, f"“{product.title}” is now in the catalogue.", level=messages.SUCCESS)
                if "save_add_another" in request.POST:
                    return redirect("admin:products_product_add_guided")
                return redirect("admin:products_product_changelist")
        else:
            form = GuidedProductForm()

        # {category id -> [{key, label}]} so the sub-category dropdown follows
        # the chosen category.
        chips = {
            str(cat.pk): [
                {"key": c.get("key", ""), "label": c.get("label", c.get("key", ""))}
                for c in (cat.chips or [])
                if isinstance(c, dict) and c.get("key") and c.get("key") != "all"
            ]
            for cat in Category.objects.filter(is_active=True)
        }
        context = {
            **self.admin_site.each_context(request),
            "title": "Add a product",
            "form": form,
            "chips": chips,
            "advanced_url": reverse("admin:products_product_add") + "?advanced=1",
        }
        return render(request, "admin/products/guided_add.html", context)

    @admin.display(description="")
    def thumb(self, obj):
        if not obj.image_url:
            return "—"
        return format_html(
            '<img src="{}" alt="" style="width:34px;height:34px;object-fit:cover;border-radius:6px;" loading="lazy">',
            obj.image_url,
        )

    @admin.display(description="Price", ordering="price")
    def price_display(self, obj):
        return format_html('<span style="font-variant-numeric:tabular-nums;">K{}</span>', f"{obj.price:,.2f}")

    @admin.display(description="Customer rating")
    def rating_summary(self, obj):
        if not obj.rating_count:
            return "No reviews yet"
        return f"{obj.rating_average} ★ · {obj.rating_count} review{'' if obj.rating_count == 1 else 's'}"


class RepliedFilter(admin.SimpleListFilter):
    title = "reply status"
    parameter_name = "replied"

    def lookups(self, request, model_admin):
        return [("no", "Needs a reply"), ("yes", "Replied")]

    def queryset(self, request, queryset):
        if self.value() == "no":
            return queryset.filter(reply_text="")
        if self.value() == "yes":
            return queryset.exclude(reply_text="")
        return queryset


def _stars(rating: int):
    colour = "#f59e0b" if rating >= 4 else ("#f59e0b" if rating == 3 else "#ef4444")
    return format_html(
        '<span style="color:{};font-size:1rem;letter-spacing:1px;" title="{} out of 5">{}</span>',
        colour, rating, "★" * rating + "☆" * (5 - rating),
    )


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    """Moderation only: reviews are written by customers in the app. Staff can
    reply publicly or delete abusive reviews — never author or edit them."""

    list_display = ("stars", "excerpt", "product", "user_name", "verified", "date", "reply_state")
    list_display_links = ("excerpt",)
    list_filter = (RepliedFilter, "rating", "verified")
    date_hierarchy = "date"
    list_per_page = 25
    search_fields = ("user_name", "text", "product__title")
    change_list_template = "admin/products/productreview/change_list.html"
    readonly_fields = (
        "product", "user", "user_name", "avatar_initial", "avatar_url",
        "rating", "text", "date", "helpful_count", "verified", "images",
    )
    fieldsets = (
        ("Customer review (read-only)", {
            "fields": ("product", "user", "user_name", "rating", "text", "date", "verified", "helpful_count"),
        }),
        ("LUXEIT reply", {
            "fields": ("reply_text", "reply_author", "reply_date"),
            "description": "Type a reply to respond publicly. The date auto-fills on first save.",
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("product")

    # Reviews come from verified customers through the app — never created here.
    def has_add_permission(self, request):
        return False

    def delete_model(self, request, obj):
        product = obj.product
        super().delete_model(request, obj)
        product.recalculate_ratings()  # keep the aggregates honest after moderation

    def delete_queryset(self, request, queryset):
        products = {r.product for r in queryset.select_related("product")}
        super().delete_queryset(request, queryset)
        for product in products:
            product.recalculate_ratings()

    @admin.display(description="Rating", ordering="rating")
    def stars(self, obj):
        return _stars(obj.rating)

    @admin.display(description="Review")
    def excerpt(self, obj):
        text = (obj.text or "").strip()
        return (text[:70] + "…") if len(text) > 70 else (text or "—")

    @admin.display(description="Reply", ordering="reply_text")
    def reply_state(self, obj):
        if obj.reply_text:
            return format_html('<span class="badge text-bg-success">Replied</span>')
        return format_html('<span class="badge text-bg-warning">Needs reply</span>')

    # ── Moderation board: cards with stars, text, and an inline reply box ────
    def get_urls(self):
        custom = [
            path(
                "moderation/",
                self.admin_site.admin_view(self.moderation_view),
                name="products_productreview_moderation",
            ),
        ]
        return custom + super().get_urls()

    def moderation_view(self, request):
        from urllib.parse import urlencode

        if request.method == "POST":
            review = ProductReview.objects.filter(pk=request.POST.get("review")).select_related("product").first()
            if review is None:
                self.message_user(request, "That review no longer exists.", level=messages.WARNING)
            elif request.POST.get("action") == "delete":
                if self.has_delete_permission(request, review):
                    product = review.product
                    review.delete()
                    product.recalculate_ratings()
                    self.message_user(request, f"Deleted {review.user_name}'s review of “{product.title}”.")
            else:  # reply (save or clear)
                review.reply_text = request.POST.get("reply_text", "").strip()
                if not review.reply_text:
                    review.reply_date = None
                review.save()
                self.message_user(
                    request,
                    "Reply published — it now shows under the review in the app." if review.reply_text else "Reply removed.",
                )
            keep = {k: request.POST.get(k, "") for k in ("filter", "q", "page") if request.POST.get(k)}
            url = reverse("admin:products_productreview_moderation")
            return redirect(f"{url}?{urlencode(keep)}" if keep else url)

        current = request.GET.get("filter", "needs_reply")
        q = request.GET.get("q", "").strip()
        qs = ProductReview.objects.select_related("product").order_by("-date", "-created_at")
        if current == "needs_reply":
            qs = qs.filter(reply_text="")
        elif current == "bad":
            qs = qs.filter(rating__lte=2)
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(text__icontains=q) | Q(user_name__icontains=q) | Q(product__title__icontains=q))

        from django.core.paginator import Paginator
        page = Paginator(qs, 15).get_page(request.GET.get("page"))
        for r in page:
            r.stars_str = "★" * r.rating + "☆" * (5 - r.rating)

        base = ProductReview.objects.all()
        context = {
            **self.admin_site.each_context(request),
            "title": "Review moderation",
            "page": page,
            "current": current,
            "q": q,
            "counts": {
                "needs_reply": base.filter(reply_text="").count(),
                "bad": base.filter(rating__lte=2).count(),
                "all": base.count(),
            },
            "can_delete": self.has_delete_permission(request),
        }
        return render(request, "admin/products/review_moderation.html", context)
