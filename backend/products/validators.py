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
MAX_PRODUCT_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB
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
