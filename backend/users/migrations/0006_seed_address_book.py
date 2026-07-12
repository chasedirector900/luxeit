"""Seed each user's address book from the primary address already saved on the
account, so existing users see their address as a selectable option immediately."""
from django.db import migrations


def seed_books(apps, schema_editor):
    User = apps.get_model("users", "User")
    Address = apps.get_model("users", "Address")
    for user in User.objects.exclude(address_line1="", address_city="").iterator():
        if not Address.objects.filter(user=user).exists():
            Address.objects.create(
                user=user,
                line1=user.address_line1,
                city=user.address_city,
                area=user.address_area,
                is_default=True,
            )


class Migration(migrations.Migration):
    dependencies = [("users", "0005_address_paymentmethod")]
    operations = [migrations.RunPython(seed_books, migrations.RunPython.noop)]
