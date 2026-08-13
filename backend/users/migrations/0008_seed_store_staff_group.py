"""Seed the "Store Staff" role: add/edit products, work the fulfilment board,
and reply to customer support threads — but never delete orders, never see
the customer list (Users/LoginCode stay superuser-only, enforced in
users/admin.py regardless of group membership), and never send bulk
promotions (hardcoded superuser-only in messaging/admin.py).
"""
from django.db import migrations

GROUP_NAME = "Store Staff"

# (app_label, model_name, [action prefixes]) -> the exact Django auto-permission
# codenames to grant. Deliberately excludes delete on every model, and
# excludes auth/users/axes models entirely.
PERMISSIONS = [
    ("products", "product", ["add", "change", "view"]),
    ("products", "productimage", ["add", "change", "view"]),
    ("products", "category", ["view"]),  # needed for the category autocomplete widget
    ("orders", "order", ["view"]),
    ("orders", "shipment", ["view", "change"]),  # the fulfilment board advances shipments
    ("messaging", "thread", ["view"]),
    ("messaging", "message", ["view", "add"]),
]


def seed_store_staff_group(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    group, _ = Group.objects.get_or_create(name=GROUP_NAME)
    perms = []
    for app_label, model_name, actions in PERMISSIONS:
        try:
            ct = ContentType.objects.get(app_label=app_label, model=model_name)
        except ContentType.DoesNotExist:
            continue
        for action in actions:
            try:
                perms.append(Permission.objects.get(content_type=ct, codename=f"{action}_{model_name}"))
            except Permission.DoesNotExist:
                continue
    group.permissions.set(perms)


def remove_store_staff_group(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.filter(name=GROUP_NAME).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0007_user_contact_phone"),
        ("products", "0011_alter_product_image_file_alter_productimage_src_file"),
        ("orders", "0008_alter_order_status_alter_orderitem_status_and_more"),
        ("messaging", "0002_message_agent"),
        ("auth", "__latest__"),
        ("contenttypes", "__latest__"),
    ]

    operations = [migrations.RunPython(seed_store_staff_group, remove_store_staff_group)]
