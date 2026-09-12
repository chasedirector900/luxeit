"""Server-side checks for uploaded product photos.

Never trust the browser's `accept` attribute or the filename extension — both
are trivial to spoof. This opens the file with Pillow and checks the format
it actually decodes as.
"""
from django.core.exceptions import ValidationError
from PIL import Image


# A raw-upload sanity ceiling, not the customer-facing size — the actual
# served size is controlled by compress_product_image (see image_processing.py),
# which re-encodes every upload to a small WebP regardless of how big the
# original camera photo was. This just stops someone uploading something
# absurd (a wrong file, a 200 MB video renamed to .jpg).
#
# Kept fairly tight (not just "absurd") because decoding a raw camera photo
# with Pillow briefly uses far more memory than the file size suggests (a
# 12MP JPEG can decode to 100MB+ of raw pixel data) — on the 512MB Render
# instance, a couple of full-size camera uploads back-to-back was enough to
# exceed the memory limit and crash the service.
MAX_PRODUCT_IMAGE_SIZE = 8 * 1024 * 1024  # 8 MB
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_product_image(file):
    if file.size > MAX_PRODUCT_IMAGE_SIZE:
        raise ValidationError(
            f"“{file.name}” is {file.size / 1024 / 1024:.1f} MB — the max is "
            f"{MAX_PRODUCT_IMAGE_SIZE // (1024 * 1024)} MB."
        )
    file.seek(0)
    try:
        image = Image.open(file)
        image_format = (image.format or "").upper()
        image.verify()
    except Exception:
        raise ValidationError(f"“{file.name}” doesn't look like a valid image file.")
    finally:
        file.seek(0)
    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise ValidationError(
            f"“{file.name}” is a {image_format or 'unknown'} file — upload a JPEG, PNG, or WebP instead."
        )
