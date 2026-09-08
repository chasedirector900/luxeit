"""Let "Store Staff" delete products (originally excluded — see
0008_seed_store_staff_group) so staff can remove a listing they added by
mistake, without needing the superuser to do it for them.
"""
from django.db import migrations

GROUP_NAME = "Store Staff"
ADDED_PERMISSIONS = [
    ("products", "product", "delete"),
]


def grant_delete_product(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    try:
        group = Group.objects.get(name=GROUP_NAME)
    except Group.DoesNotExist:
        return

    for app_label, model_name, action in ADDED_PERMISSIONS:
        try:
            ct = ContentType.objects.get(app_label=app_label, model=model_name)
            perm = Permission.objects.get(content_type=ct, codename=f"{action}_{model_name}")
        except (ContentType.DoesNotExist, Permission.DoesNotExist):
            continue
        group.permissions.add(perm)


def revoke_delete_product(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    try:
        group = Group.objects.get(name=GROUP_NAME)
    except Group.DoesNotExist:
        return

    for app_label, model_name, action in ADDED_PERMISSIONS:
        try:
            ct = ContentType.objects.get(app_label=app_label, model=model_name)
            perm = Permission.objects.get(content_type=ct, codename=f"{action}_{model_name}")
        except (ContentType.DoesNotExist, Permission.DoesNotExist):
            continue
        group.permissions.remove(perm)


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0009_user_must_change_password"),
        ("products", "0011_alter_product_image_file_alter_productimage_src_file"),
        ("auth", "__latest__"),
        ("contenttypes", "__latest__"),
    ]

    operations = [migrations.RunPython(grant_delete_product, revoke_delete_product)]
