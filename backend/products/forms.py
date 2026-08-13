"""The guided "Add product" form — plain-language, for non-technical staff.

A ModelForm so the model's own rules run (air price only for China hub, air ≥
sea). Slug is generated from the title; gallery images are pasted one per line
and created as ProductImage rows. Gallery file uploads arrive as plain
`request.FILES` entries under "gallery_files" — not a declared form field,
since Django's file widgets don't support binding a single field to multiple
uploads — but they're still visible on `self.files` and validated/saved
alongside the pasted links.
"""
from django import forms
from django.utils.text import slugify

from .models import Product, ProductImage, ProductType, Warehouse


class GuidedProductForm(forms.ModelForm):
    # Physical products only in the guided flow, so the hub is a required choice.
    warehouse = forms.ChoiceField(
        label="Where does it ship from?",
        choices=[(Warehouse.CHINA, "China hub — sourced & imported"),
                 (Warehouse.ZAMBIA, "Lusaka hub — local stock")],
        widget=forms.RadioSelect,
        initial=Warehouse.CHINA,
    )
    gallery = forms.CharField(
        label="…or paste gallery links instead",
        required=False,
        widget=forms.Textarea(attrs={"rows": 3, "placeholder": "Paste one image link per line…"}),
        help_text="Only needed for photos you don't upload above. One link per line.",
    )

    class Meta:
        model = Product
        fields = [
            "title", "category", "sub_category", "product_type", "subtitle",
            "description", "warehouse", "price", "original_price", "air_price",
            "delivery_estimate", "preorder", "image_file", "image", "video", "is_active",
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
            "image": "…or paste an image link instead",
            "video": "Video link (optional)",
            "is_active": "Visible in the shop right away",
        }
        help_texts = {
            "title": "What customers will see, e.g. “RAV4 Air Filter”.",
            "sub_category": "Pick after choosing the category — it filters the category page.",
            "price": "The full price customers pay — delivery included. For China items this is the SEA price.",
            "air_price": "Only for China items. Fill this in to also offer faster air delivery at a higher price.",
            "image_file": "Uploaded photos are stored in Cloudflare R2 and win over the link field below.",
            "image": "Only used if you don't upload a file above. You'll see a preview.",
            "description": "A few sentences about the product — what it is, what's in the box, why it's good.",
        }
        widgets = {
            "description": forms.Textarea(attrs={"rows": 4}),
            "sub_category": forms.Select(choices=[("", "— choose a category first —")]),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["category"].required = True
        self.fields["category"].empty_label = "Choose a category…"
        self.fields["product_type"].initial = ProductType.GENERAL

    def clean_sub_category(self):
        # Free value — validated softly; the select is populated from the
        # chosen category's chips client-side.
        return (self.cleaned_data.get("sub_category") or "").strip()

    def clean_gallery(self):
        lines = [l.strip() for l in self.cleaned_data["gallery"].splitlines() if l.strip()]
        for line in lines:
            if not (line.startswith("http://") or line.startswith("https://") or line.startswith("data:")):
                raise forms.ValidationError(f"“{line[:40]}…” doesn't look like an image link.")
        return lines

    def clean(self):
        cleaned = super().clean()
        if not cleaned.get("gallery") and not self.files.getlist("gallery_files"):
            self.add_error("gallery", "Add at least one gallery photo — upload a file or paste a link.")
        return cleaned

    def save(self, commit=True):
        product = super().save(commit=False)
        product.slug = self._unique_slug(product.title)
        if commit:
            product.save()
            position = 0
            for image_file in self.files.getlist("gallery_files"):
                ProductImage.objects.create(product=product, src_file=image_file, position=position)
                position += 1
            for src in self.cleaned_data["gallery"]:
                ProductImage.objects.create(product=product, src=src, position=position)
                position += 1
        return product

    @staticmethod
    def _unique_slug(title: str) -> str:
        base = slugify(title)[:150] or "product"
        slug, i = base, 2
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base}-{i}"
            i += 1
        return slug
