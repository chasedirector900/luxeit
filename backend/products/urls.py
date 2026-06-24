from django.urls import re_path

from . import views

app_name = "products"

# Trailing slash optional (`/?$`) — see users/urls.py for the why.
urlpatterns = [
    re_path(r"^products/?$", views.ProductListView.as_view(), name="list"),
    re_path(r"^products/(?P<slug>[-\w]+)/?$", views.ProductDetailView.as_view(), name="detail"),
    re_path(r"^categories/?$", views.CategoryListView.as_view(), name="categories"),
    re_path(r"^categories/(?P<slug>[-\w]+)/?$", views.CategoryDetailView.as_view(), name="category-detail"),
]
