# Changelog

A running log of notable decisions and changes — the "why," not just the
"what" (git history already has that). Add an entry whenever a change isn't
self-explanatory from the diff alone: permission changes, business-rule
decisions, anything a future reader would otherwise have to ask about.

## 2026-09-10

- **Search: word-by-word AND matching, staff keywords, and a diversified home
  feed.** Reported bug: searching "watch" found almost nothing despite 19 real
  watch products, because search only matched `title`/`searchable_text` as one
  whole substring — and every one of those products is titled by brand
  ("Curren", "Mark Fairwhale", "Bestwin"), never the word "watch", and the
  guided add form had no field to enter `searchable_text` at all (same gap
  pattern as the earlier footwear-sizes and fulfilment-variant issues: a model
  field with nowhere in the UI to set it).
  - `ProductListView` (`backend/products/views.py`, backs the global
    `/explore/search` page) now ANDs each word of the query across
    title/subtitle/keywords/category/sub-category/product-type — so "watch"
    now matches by category+type alone, and "curren watch" only matches
    when every word is accounted for somewhere.
  - Added a "Search keywords (optional)" field to the guided add form
    (maps straight to `Product.searchable_text`) so staff can tag brand
    names, synonyms, etc. going forward.
  - The in-category listing search (`frontend-ui/src/lib/category/shared.ts`
    `filterListing`, a separate client-side matcher against the category
    payload) had the same whole-string/no-keywords gap — `keywords` is now
    in `ListingProductSerializer`'s payload and `ListingProduct`'s type, and
    matching is word-by-word AND there too.
  - Separately reported: the home feed was showing almost nothing but one
    category (electronics at the time, watches before that) after a bulk
    upload. `recommend()` (`backend/products/recommendations.py`) scored and
    sorted the whole candidate set with no cap, so a category with many
    fresh/popular listings could take every slot. Added `_diversify()`:
    round-robins the best remaining item from each category (ranked by that
    category's current top score, so personalisation still decides who goes
    first) instead of a flat sort — a bulk upload can no longer crowd out
    every other category. Only applied when the feed isn't already scoped to
    one category (browsing within a category still sorts by score alone).

- **Product gallery: instant thumbnail switching with a skeleton, not a blank
  flash.** On a slow connection, clicking a gallery thumbnail used to leave
  the main image blank until the full-size photo finished downloading — the
  `<Image>` component doesn't keep showing the old photo while a new `src`
  loads. `SearchProductDetailClient` (`frontend-ui/src/components/search/`)
  is the one shared component behind every product-detail route (home,
  explore, category all render it — see `frontend-ui/AGENTS.md` for why this
  version's routing may not match training data), so the fix applies
  everywhere at once: the thumbnail selection itself was already instant
  (plain React state), but now the main image shows an animated skeleton
  (matching this app's existing skeleton style) until that specific image's
  `onLoad` fires, then fades it in. Already-loaded images in the same product
  view don't re-show the skeleton on revisit.

- **Fulfilment board: a "Couldn't source" action for out-of-stock variants,
  with refund tracking.** Dropshipping risk: a size/variant a customer picked
  may not actually be available when staff go to buy it from the China
  supplier. The "To source" stage of the fulfilment board already split its
  buy list by product *and* variant (so a size was already visible as its own
  line with its own quantity/customer count) — it just had no way to act on
  "we can't get this one." Added a per-line "Couldn't source" button
  (`orders/admin.py` `ShipmentAdmin._advance`, `orders/fulfilment.py`
  `cancel_unavailable_items`), sourcing-stage-only and always scoped to one
  product+variant line (never a whole order or the whole batch — a bad size
  shouldn't cancel a customer's other items). It cancels just that line,
  drops it from `Order.total` (which previously wasn't recalculated on any
  cancellation — also fixed here), notifies the customer by name+amount, and
  sets `OrderItem.refunded = False` as a checklist item since there's no live
  payment gateway yet to auto-refund (see the December checklist in
  `DEPLOYMENT.md`) — tick it on the order's item once the money is actually
  sent. `OrderAdmin` gained a "Refund owed" column and a "Needs refund" filter
  so a cancelled-and-unrefunded line can't get lost.
  Also fixed in passing: the Order admin change page 500'd for every order
  (blank "add item" row tried `unit_price * quantity` on `None`) — items are
  checkout-only, so `OrderItemInline` now blocks manual add like `OrderAdmin`
  already does for orders themselves.

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
