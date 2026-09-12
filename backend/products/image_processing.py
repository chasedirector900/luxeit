"""Shrink uploaded product photos before they ever reach storage.

Staff upload whatever comes off a phone camera (often several MB); customers
are mostly on Zambian mobile data, so what actually gets stored — and served
on every page load — needs to be small regardless of the source. This
resizes to a generous on-screen ceiling and re-encodes to WebP, which is a
few times smaller than a camera JPEG at the same visual quality.
"""
import io
from pathlib import Path

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

# The largest a product photo is ever rendered at on the storefront is the
# product-detail hero (~520px, next/image adds its own responsive srcset on
# top). 1600px leaves headroom for high-DPI screens without keeping the raw
# multi-megapixel camera original around.
MAX_DIMENSION = 1600
WEBP_QUALITY = 82
# WebP encode effort, 0 (fastest/lightest) - 6 (smallest file, most CPU/memory).
# 6 was tipping a 512MB instance over its memory limit when staff uploaded
# several large camera photos back-to-back; 4 costs a little more file size
# for a much lighter encode.
WEBP_METHOD = 4


def compress_product_image(file):
    """Return a new, storage-ready File: resized, re-encoded WebP.

    `file` is the freshly uploaded file straight from the form (already
    passed `validate_product_image`, so it's a decodable JPEG/PNG/WebP under
    the raw size ceiling). Returns a `ContentFile` suitable for assigning
    straight to an `ImageField`.
    """
    file.seek(0)
    image = Image.open(file)
    # Respect phone camera EXIF orientation before resizing, or sideways/
    # upside-down photos get baked in permanently once the EXIF is dropped.
    image = ImageOps.exif_transpose(image)
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
    image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)
    buffer.seek(0)

    name = Path(file.name).stem + ".webp"
    return ContentFile(buffer.read(), name=name)
