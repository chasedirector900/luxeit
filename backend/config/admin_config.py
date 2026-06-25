"""Site-wide Django admin polish: branding, de-cluttering, and a clean,
logically grouped index. Imported for its side effects by config/urls.py
(after admin autodiscover has registered every app's models).
"""
import types

from django.contrib import admin
from django.contrib.admin.sites import NotRegistered
from django.contrib.auth.models import Group

# ── Branding ────────────────────────────────────────────────────────────────
admin.site.site_header = "Luxeit Admin"
admin.site.site_title = "Luxeit"
admin.site.index_title = "Operations"

# ── Hide clutter (and sensitive noise) from the admin ───────────────────────
from products.models import ProductImage  # managed inline on Product
from users.models import LoginCode          # one-time codes — never browsed

for _model in (Group, LoginCode, ProductImage):
    try:
        admin.site.unregister(_model)
    except NotRegistered:
        pass

# ── Group + order the index so related things sit together ──────────────────
_SECTION_ORDER = ["orders", "products", "users", "messaging"]
_MODEL_ORDER = {
    "orders": ["Order", "Shipment"],
    "products": ["Product", "Category", "ProductReview"],
    "users": ["User"],
    "messaging": ["Thread", "Message"],
}


def _order_models(app: dict, label: str) -> dict:
    order = _MODEL_ORDER.get(label, [])
    app["models"].sort(
        key=lambda m: (order.index(m["object_name"]) if m["object_name"] in order else 999, m["name"]),
    )
    return app


def _get_app_list(self, request, app_label=None):
    app_dict = self._build_app_dict(request, app_label)
    if app_label:
        app = app_dict.get(app_label)
        return [_order_models(app, app_label)] if app else []
    result = [
        _order_models(app_dict[label], label) for label in _SECTION_ORDER if label in app_dict
    ]
    # Any other registered apps fall in afterwards, alphabetically.
    for label in sorted(app_dict):
        if label not in _SECTION_ORDER:
            result.append(app_dict[label])
    return result


admin.site.get_app_list = types.MethodType(_get_app_list, admin.site)
