"""Broadcast a promotion to every active user's inbox.

    python manage.py send_promo "Weekly deals are live — up to 40% off China imports."
"""
from django.core.management.base import BaseCommand

from messaging.services import broadcast_promo


class Command(BaseCommand):
    help = "Broadcast a promotion message to all active users."

    def add_arguments(self, parser):
        parser.add_argument("body", type=str, help="The promotion text to send.")

    def handle(self, *args, **options):
        count = broadcast_promo(options["body"])
        self.stdout.write(self.style.SUCCESS(f"Sent promo to {count} user(s)."))
