"""Hide clutter (and sensitive noise) from the admin. Branding + section
ordering are handled by Jazzmin (see JAZZMIN_SETTINGS). Imported for its side
effects by config/urls.py, after admin autodiscover has registered every model.
"""
from django.contrib import admin
from django.contrib.admin.sites import NotRegistered
from django.contrib.auth.models import Group

from products.models import ProductImage  # managed inline on Product
from users.models import LoginCode          # one-time codes — never browsed

for _model in (Group, LoginCode, ProductImage):
    try:
        admin.site.unregister(_model)
    except NotRegistered:
        pass
