# Changelog

A running log of notable decisions and changes — the "why," not just the
"what" (git history already has that). Add an entry whenever a change isn't
self-explanatory from the diff alone: permission changes, business-rule
decisions, anything a future reader would otherwise have to ask about.

## 2026-09-10

- **Footwear products now support a Size picker.** No schema change — the
  generic `Product.options` variant system (already wired through the product
  page, cart, and order fulfilment board) was just unused for footwear. Added
  a "Available sizes" field to the guided "Add product" admin form (shown only
  when Product type = Footwear, required there); it builds a `{name: "Size",
  key: "size", values: [...]}` option on save. Existing footwear products
  (added before this change) have no size option — run
  `python manage.py backfill_footwear_sizes` once to give them a default EU
  38-45 range. See `backend/products/forms.py` (`GuidedProductForm`) and
  `backend/products/management/commands/backfill_footwear_sizes.py`.

## 2026-09-08

- **Store Staff can now delete products.** Previously only the superuser
  could delete a product — staff who made a listing mistake had to ask the
  superuser to remove it. Added `backend/users/migrations/0010_store_staff_can_delete_products.py`
  to grant `delete_product` to the Store Staff group. See
  `docs/STAFF_PERMISSIONS.md` for the full permissions matrix.
