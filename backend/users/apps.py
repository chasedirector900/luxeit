from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    verbose_name = "Customers"

    def ready(self):
        from . import signals  # noqa: F401 — connects the user_logged_in receiver
