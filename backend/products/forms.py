"""The guided "Add product" form — plain-language, for non-technical staff.

A ModelForm so the model's own rules run (air price only for China hub, air ≥
sea). Slug is generated from the title. Gallery photos arrive as plain
`request.FILES` entries under "gallery_files" — not a declared form field,
since Django's file widgets don't support binding a single field to multiple
uploads — but they're still visible on `self.files` and validated/saved
alongside the form.
"""
from django import forms
from django.core.exceptions import ValidationError
from django.utils.text import slugify

from .models import Product, ProductImage, ProductType, Warehouse
from .validators import validate_product_image


class GuidedProductForm(forms.ModelForm):
    # Physical products only in the guided flow, so the hub is a required choice.
    warehouse = forms.ChoiceField(
        label="Where does it ship from?",
        choices=[(Warehouse.CHINA, "China hub — sourced & imported"),
                 (Warehouse.ZAMBIA, "Lusaka hub — local stock")],
        widget=forms.RadioSelect,
        initial=Warehouse.CHINA,
    )
    # Footwear only — becomes the product's "Size" variant option on save.
    # Not a model field: it's rendered/required conditionally in the template's
    # step 1 and turned into `Product.options` in `save()`.
    sizes = forms.CharField(
        label="Available sizes",
        required=False,
        help_text="Footwear only — comma-separated sizes customers can pick from, e.g. 38, 39, 40, 41, 42.",
        widget=forms.TextInput(attrs={"placeholder": "e.g. 38, 39, 40, 41, 42"}),
    )

    class Meta:
        model = Product
        fields = [
            "title", "category", "sub_category", "product_type", "subtitle",
            "description", "warehouse", "price", "original_price", "air_price",
            "delivery_estimate", "preorder", "image_file", "video",
            "searchable_text", "is_active",
        ]
        labels = {
            "title": "Product name",
            "category": "Category",
            "sub_category": "Sub-category",
            "product_type": "Product type",
            "subtitle": "Short tagline (optional)",
            "description": "Description",
            "price": "Price (K)",
            "original_price": "Was-price for discounts (optional)",
            "air_price": "Air-freight price (K, optional)",
            "delivery_estimate": "Delivery estimate (optional)",
            "preorder": "This is a pre-order item",
            "image_file": "Upload main photo",
            "video": "Video link (optional)",
            "searchable_text": "Search keywords (optional)",
            "is_active": "Visible in the shop right away",
        }
        help_texts = {
            "title": "What customers will see, e.g. “RAV4 Air Filter”.",
            "sub_category": "Pick after choosing the category — it filters the category page.",
            "price": "The full price customers pay — delivery included. For China items this is the SEA price.",
            "air_price": "Only for China items. Fill this in to also offer faster air delivery at a higher price.",
            "image_file": "Uploaded photos are stored in Cloudflare R2.",
            "description": "A few sentences about the product — what it is, what's in the box, why it's good.",
            "searchable_text": (
                "Extra words shoppers might search for that aren't in the name — brand, alternate "
                "spellings, what it's for, e.g. \"Curren mens chronograph steel strap\". The product "
                "name, category and type are already searchable, so this is only for extra terms."
            ),
        }
        widgets = {
            "description": forms.Textarea(attrs={"rows": 4}),
            "sub_category": forms.Select(choices=[("", "— choose a category first —")]),
            "image_file": forms.ClearableFileInput(attrs={"accept": "image/jpeg,image/png,image/webp"}),
            "searchable_text": forms.Textarea(attrs={"rows": 2, "placeholder": "e.g. Curren mens chronograph steel strap"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["category"].required = True
        self.fields["category"].empty_label = "Choose a category…"
        self.fields["product_type"].initial = ProductType.GENERAL
        self.fields["image_file"].required = True

    def clean_sub_category(self):
        # Free value — validated softly; the select is populated from the
        # chosen category's chips client-side.
        return (self.cleaned_data.get("sub_category") or "").strip()

    def clean(self):
        cleaned = super().clean()
        gallery_files = self.files.getlist("gallery_files")
        for image_file in gallery_files:
            try:
                validate_product_image(image_file)
            except ValidationError as exc:
                self.add_error(None, exc)
        if not gallery_files:
            self.add_error(None, "Add at least one gallery photo.")
        if cleaned.get("product_type") == ProductType.FOOTWEAR and not self._parse_sizes(cleaned.get("sizes", "")):
            self.add_error("sizes", "Add at least one size, e.g. 38, 39, 40.")
        return cleaned

    def save(self, commit=True):
        product = super().save(commit=False)
        product.slug = self._unique_slug(product.title)
        if product.product_type == ProductType.FOOTWEAR:
            product.options = [{
                "name": "Size",
                "key": "size",
                "required": True,
                "values": self._parse_sizes(self.cleaned_data.get("sizes", "")),
            }]
        if commit:
            product.save()
            for position, image_file in enumerate(self.files.getlist("gallery_files")):
                ProductImage.objects.create(product=product, src_file=image_file, position=position)
        return product

    @staticmethod
    def _parse_sizes(raw: str) -> list:
        """Comma-separated input -> a deduped, order-preserving list of size labels."""
        sizes = []
        for part in (raw or "").split(","):
            value = part.strip()
            if value and value not in sizes:
                sizes.append(value)
        return sizes[:30]

    @staticmethod
    def _unique_slug(title: str) -> str:
        base = slugify(title)[:150] or "product"
        slug, i = base, 2
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base}-{i}"
            i += 1
        return slug
