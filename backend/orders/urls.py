from django.urls import re_path

from . import views

app_name = "orders"

# Trailing slash optional (matches the rest of the API).
urlpatterns = [
    re_path(r"^orders/?$", views.orders, name="orders"),
    re_path(r"^orders/(?P<reference>[-\w]+)/?$", views.order_detail, name="order-detail"),
]
