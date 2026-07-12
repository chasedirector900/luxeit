from django.urls import re_path

from . import feed_views, views

app_name = "products"

# Trailing slash optional (`/?$`) — see users/urls.py for the why.
urlpatterns = [
    re_path(r"^products/?$", views.ProductListView.as_view(), name="list"),
    re_path(r"^products/(?P<slug>[-\w]+)/review/?$", views.product_review, name="review"),
    re_path(r"^products/(?P<slug>[-\w]+)/?$", views.ProductDetailView.as_view(), name="detail"),
    re_path(r"^categories/?$", views.CategoryListView.as_view(), name="categories"),
    re_path(r"^categories/(?P<slug>[-\w]+)/?$", views.CategoryDetailView.as_view(), name="category-detail"),
    # Wishlist — server-side per account, so hearts follow the user, not the device.
    re_path(r"^saved/?$", views.saved_list, name="saved"),
    re_path(r"^saved/(?P<slug>[-\w]+)/?$", views.saved_toggle, name="saved-toggle"),
    # Smart feed + interaction tracking + search terms.
    re_path(r"^feed/?$", feed_views.feed, name="feed"),
    re_path(r"^events/?$", feed_views.record_event, name="events"),
    re_path(r"^searches/?$", feed_views.searches, name="searches"),
]
