from django.urls import re_path

from . import views

app_name = "messaging"

# Trailing slash optional (matches the rest of the API — see users/urls.py).
urlpatterns = [
    re_path(r"^threads/?$", views.threads_list, name="threads"),
    re_path(r"^read-all/?$", views.read_all, name="read-all"),
    re_path(r"^threads/(?P<slug>[-\w]+)/messages/?$", views.send_message, name="send-message"),
    re_path(r"^threads/(?P<slug>[-\w]+)/read/?$", views.mark_thread_read, name="mark-read"),
    re_path(r"^threads/(?P<slug>[-\w]+)/?$", views.thread_detail, name="thread-detail"),
]
