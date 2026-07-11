"""The guided "Add product" form — plain-language, for non-technical staff.

A ModelForm so the model's own rules run (air price only for China hub, air ≥
sea). Slug is generated from the title; gallery images are pasted one per line
and created as ProductImage rows.
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
        label="Gallery photos",
        widget=forms.Textarea(attrs={"rows": 3, "placeholder": "Paste one image link per line…"}),
        help_text="At least one extra photo besides the main one. One link per line.",
    )

    class Meta:
        model = Product
        fields = [
            "title", "category", "sub_category", "product_type", "subtitle",
            "description", "warehouse", "price", "original_price", "air_price",
            "delivery_estimate", "preorder", "image", "video", "is_active",
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
            "image": "Main photo link",
            "video": "Video link (optional)",
            "is_active": "Visible in the shop right away",
        }
        help_texts = {
            "title": "What customers will see, e.g. “RAV4 Air Filter”.",
            "sub_category": "Pick after choosing the category — it filters the category page.",
            "price": "The full price customers pay — delivery included. For China items this is the SEA price.",
            "air_price": "Only for China items. Fill this in to also offer faster air delivery at a higher price.",
            "image": "Paste an image link. You'll see a preview.",
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
        if not lines:
            raise forms.ValidationError("Add at least one gallery photo link.")
        for line in lines:
            if not (line.startswith("http://") or line.startswith("https://") or line.startswith("data:")):
                raise forms.ValidationError(f"“{line[:40]}…” doesn't look like an image link.")
        return lines

    def save(self, commit=True):
        product = super().save(commit=False)
        product.slug = self._unique_slug(product.title)
        if commit:
            product.save()
            for idx, src in enumerate(self.cleaned_data["gallery"]):
                ProductImage.objects.create(product=product, src=src, position=idx)
        return product

    @staticmethod
    def _unique_slug(title: str) -> str:
        base = slugify(title)[:150] or "product"
        slug, i = base, 2
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base}-{i}"
            i += 1
        return slug
