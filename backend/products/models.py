from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import F
from django.utils import timezone

from .image_processing import compress_product_image
from .validators import validate_product_image


class ProductType(models.TextChoices):
    FOOTWEAR = "footwear", "Footwear"
    WATCH = "watch", "Watch"
    CAR_PART = "car_part", "Car part"
    SECURITY = "security", "Security"
    DIGITAL = "digital", "Digital"
    GENERAL = "general", "General"


class Warehouse(models.TextChoices):
    CHINA = "china", "China hub"
    ZAMBIA = "zambia", "Lusaka (Zambia) hub"


class Origin(models.TextChoices):
    CHINA = "China", "China"
    GLOBAL = "Global", "Global"


class ShippingMethod(models.TextChoices):
    AIR = "air", "Air"
    SEA = "sea", "Sea"


class ObjectFit(models.TextChoices):
    CONTAIN = "contain", "Contain"
    COVER = "cover", "Cover"


class Category(models.Model):
    """A top-level shop category (footwear, watches, electronics, security, ...).

    Beyond identity (slug/name), a category also carries the presentation
    "chrome" for its listing page — subtitle, search placeholder, hero banner,
    sub-category chips and the trust-feature strip — so a listing page can be
    driven entirely from the backend (see the car brand categories).
    """

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=120)
    blurb = models.CharField(max_length=255, blank=True)

    # Listing-page chrome (mirrors the frontend CategoryConfig shape).
    subtitle = models.CharField(max_length=255, blank=True)
    search_placeholder = models.CharField(max_length=120, blank=True)
    hero = models.JSONField(default=dict, blank=True)       # {badge, title, subtitle}
    chips = models.JSONField(default=list, blank=True)      # [{key, label, icon}]
    features = models.JSONField(default=list, blank=True)   # [{icon, title, subtitle, tint, ring}]

    ordering = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["ordering", "name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    """A sellable product. `product_type` selects which type-specific fields apply.

    Type-specific content is kept as structured JSON (options, spec groups,
    compatibility, ...) so each type can carry its own attributes without a rigid
    column-per-type schema. Gallery images live in the related `ProductImage`
    model; this mirrors the frontend Product shape.
    """

    slug = models.SlugField(unique=True, max_length=160)
    title = models.CharField(max_length=200)
    product_type = models.CharField(max_length=20, choices=ProductType.choices, default=ProductType.GENERAL)
    category = models.ForeignKey(
        Category, related_name="products", on_delete=models.SET_NULL, null=True, blank=True
    )
    # Chip/sub-category key within a category listing (e.g. "sneakers", "phones").
    sub_category = models.CharField(max_length=40, blank=True)
    # Short one-line tagline shown under the title on listing cards.
    subtitle = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True, help_text="Full description shown on the product detail page.")

    # Pricing. For China-hub goods, `price` is the SEA (standard, cheaper) price
    # and `air_price` is the faster, pricier air-freight option. Zambia-hub goods
    # use `price` only (already local — no shipping choice).
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Sea/standard price (China hub) or the local price (Zambia hub).")
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    air_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="China hub only: price when shipped by air. Leave blank if only sea shipping is offered.",
    )

    # Media — thumbnail (required) + relational gallery (ProductImage) + optional video.
    # Wide enough to hold a self-contained SVG data-URI placeholder, not just a URL.
    image = models.CharField(
        "thumbnail URL",
        max_length=2048,
        blank=True,
        help_text="Image URL or data URI. Leave blank if you upload a thumbnail below.",
    )
    # Upload a real photo here and it wins over the `image` string above. Files
    # go to Cloudflare R2 in production, the local media/ folder in dev.
    image_file = models.ImageField(
        "thumbnail upload",
        upload_to="products/",
        blank=True,
        validators=[validate_product_image],
        help_text="Upload a thumbnail photo. If set, this is used instead of the thumbnail URL above.",
    )
    video = models.CharField(max_length=500, blank=True, help_text="Optional product video URL.")
    video_thumbnail = models.CharField(max_length=500, blank=True, help_text="Poster image for the video.")

    # Fulfilment hub. Required for physical goods (see clean); digital has no hub.
    warehouse = models.CharField(max_length=10, choices=Warehouse.choices, blank=True)
    origin = models.CharField(max_length=10, choices=Origin.choices, blank=True)
    shipping_method = models.CharField(max_length=5, choices=ShippingMethod.choices, blank=True)
    delivery_estimate = models.CharField(max_length=60, blank=True)
    import_tag = models.CharField(max_length=40, blank=True)
    preorder = models.BooleanField(default=False)

    # Sales / merchandising
    units_sold = models.PositiveIntegerField(default=0, help_text="Total units sold (drives the 'X sold' label).")
    searchable_text = models.TextField(blank=True)

    # Type-specific structured content (shape matches the frontend Product type)
    options = models.JSONField(default=list, blank=True)          # variants: size, color, ...
    spec_groups = models.JSONField(default=list, blank=True)      # [{title, specs:[{label,value}]}]
    compatibility = models.JSONField(null=True, blank=True)       # car-part vehicle fitment
    package_contents = models.JSONField(default=list, blank=True)
    notices = models.JSONField(default=list, blank=True)
    review_tags = models.JSONField(default=list, blank=True)      # [{label, count}]

    # Denormalised rating aggregates (kept in sync from reviews).
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    rating_breakdown = models.JSONField(default=dict, blank=True)  # {"5": n, ... "1": n}

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product_type"]),
            models.Index(fields=["category", "sub_category"]),
            models.Index(fields=["warehouse"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["-units_sold"]),
        ]

    def __str__(self):
        return self.title

    # ETA labels for the two China-hub freight methods.
    SEA_ETA = "About 2 months (Sea)"
    AIR_ETA = "About 2 weeks (Air)"

    def clean(self):
        # Physical goods ship from a hub; digital goods don't.
        if self.product_type != ProductType.DIGITAL and not self.warehouse:
            raise ValidationError({"warehouse": "Physical products must specify a hub (China or Zambia)."})
        # Air pricing only makes sense for China-hub goods, and air should cost
        # at least as much as sea (it's the premium option).
        if self.air_price is not None:
            if self.warehouse != Warehouse.CHINA:
                raise ValidationError({"air_price": "Air price applies to China-hub products only."})
            if self.air_price < self.price:
                raise ValidationError({"air_price": "Air price should be greater than or equal to the sea price."})

        # A thumbnail is still required — but it can come from either an upload
        # or the URL field, so uploads alone are enough.
        if not self.image and not self.image_file:
            raise ValidationError(
                {"image_file": "Upload a thumbnail photo, or paste an image URL in the thumbnail field."}
            )

    def save(self, *args, **kwargs):
        # `_committed` is False only for a freshly assigned, not-yet-stored
        # upload — never for a file already sitting in storage — so an
        # unrelated edit that re-saves the product doesn't reprocess it again.
        if self.image_file and not self.image_file._committed:
            self.image_file = compress_product_image(self.image_file)
        super().save(*args, **kwargs)

    @property
    def image_url(self) -> str:
        """The thumbnail to serve: an uploaded file if there is one, else the URL.

        Lets us move to real uploads (R2) product by product without breaking
        the rows that still carry a URL or data-URI in `image`.
        """
        if self.image_file:
            return self.image_file.url
        return self.image

    @property
    def is_digital(self) -> bool:
        return self.product_type == ProductType.DIGITAL

    @property
    def has_dual_shipping(self) -> bool:
        """China-hub product offering both sea and air freight at different prices."""
        return self.warehouse == Warehouse.CHINA and self.air_price is not None

    @property
    def display_price(self):
        """Headline price = the cheapest a customer can pay (sea for dual-ship)."""
        return self.price

    def shipping_options(self) -> list:
        """Per-method price options for the storefront. Empty unless dual-shipping."""
        if not self.has_dual_shipping:
            return []
        return [
            {"method": "sea", "label": "Sea", "price": float(self.price), "eta": self.SEA_ETA},
            {"method": "air", "label": "Air", "price": float(self.air_price), "eta": self.AIR_ETA},
        ]

    def record_sale(self, quantity: int = 1) -> None:
        """Atomically increase the sold counter (call when an order is paid)."""
        Product.objects.filter(pk=self.pk).update(units_sold=F("units_sold") + quantity)
        self.refresh_from_db(fields=["units_sold"])

    def recalculate_ratings(self) -> None:
        """Recompute aggregate rating fields from the related reviews."""
        breakdown = {str(star): 0 for star in range(1, 6)}
        total = 0
        count = 0
        for review in self.reviews.all():
            breakdown[str(review.rating)] += 1
            total += review.rating
            count += 1
        self.rating_count = count
        self.rating_average = round(total / count, 2) if count else 0
        self.rating_breakdown = breakdown
        self.save(update_fields=["rating_count", "rating_average", "rating_breakdown"])


class ProductImage(models.Model):
    """A gallery image for a product (the 'different angle' shots).

    The product's `image` field is the thumbnail; these are the additional shots.
    Business rule (enforced in the admin): a product needs its thumbnail plus at
    least one ProductImage.
    """

    product = models.ForeignKey(Product, related_name="images", on_delete=models.CASCADE)
    src = models.CharField(max_length=2048, blank=True, help_text="Image URL or data URI.")
    src_file = models.ImageField(
        "upload",
        upload_to="products/gallery/",
        blank=True,
        validators=[validate_product_image],
        help_text="Upload a photo. If set, this is used instead of the URL above.",
    )
    alt = models.CharField(max_length=200, blank=True)
    object_fit = models.CharField(max_length=8, choices=ObjectFit.choices, default=ObjectFit.CONTAIN)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]

    def save(self, *args, **kwargs):
        if self.src_file and not self.src_file._committed:
            self.src_file = compress_product_image(self.src_file)
        super().save(*args, **kwargs)

    @property
    def src_url(self) -> str:
        """Uploaded file if there is one, else the URL/data-URI in `src`."""
        if self.src_file:
            return self.src_file.url
        return self.src

    def __str__(self):
        return f"{self.product.title} image #{self.position}"


class ProductEvent(models.Model):
    """A lightweight interaction signal (a view, or an add-to-cart) used to learn
    what a customer is into. Purchases, saves and reviews live in their own
    tables and are read by the recommender directly — this covers the rest."""

    VIEW = "view"
    CART = "cart"
    KIND_CHOICES = [(VIEW, "Viewed"), (CART, "Added to cart")]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="product_events", on_delete=models.CASCADE
    )
    product = models.ForeignKey(Product, related_name="events", on_delete=models.CASCADE)
    kind = models.CharField(max_length=8, choices=KIND_CHOICES, default=VIEW)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"{self.user} {self.kind} {self.product}"


class SearchQuery(models.Model):
    """A search a customer ran — powers per-user 'recent searches' and the
    global 'popular searches' list."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="searches", on_delete=models.CASCADE
    )
    term = models.CharField(max_length=120)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"{self.user}: {self.term}"


class SavedItem(models.Model):
    """A product on the user's wishlist — server-side, per-account, so hearts
    follow the user across devices and never leak on a shared phone."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="saved_items", on_delete=models.CASCADE
    )
    product = models.ForeignKey(Product, related_name="saved_by", on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "product"], name="uniq_saved_user_product"),
        ]

    def __str__(self):
        return f"{self.user} ♥ {self.product}"


class ProductReview(models.Model):
    product = models.ForeignKey(Product, related_name="reviews", on_delete=models.CASCADE)
    # Optional link to the authenticated user who wrote it (reviews may be seeded too).
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="product_reviews", on_delete=models.SET_NULL, null=True, blank=True
    )
    user_name = models.CharField(max_length=120)
    avatar_initial = models.CharField(max_length=2, blank=True)
    avatar_url = models.CharField(max_length=500, blank=True)
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    text = models.TextField(blank=True)
    date = models.DateField(default=timezone.now)
    helpful_count = models.PositiveIntegerField(default=0)
    # True when written by a customer who actually bought the product.
    verified = models.BooleanField(default=False)
    images = models.JSONField(default=list, blank=True)
    # LUXEIT admin/seller reply — leave reply_text blank for no reply.
    reply_text = models.TextField(blank=True)
    reply_author = models.CharField(max_length=120, blank=True, default="LUXEIT Support")
    reply_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.user_name} - {self.rating} star - {self.product.title}"

    def save(self, *args, **kwargs):
        # Auto-stamp the reply date the first time a reply is written.
        if self.reply_text and not self.reply_date:
            self.reply_date = timezone.now().date()
        super().save(*args, **kwargs)
