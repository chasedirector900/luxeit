from django.urls import re_path

from . import views

app_name = "api"

urlpatterns = [
    re_path(r"^health/?$", views.health, name="health"),
]
