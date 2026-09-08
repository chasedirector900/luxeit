# Staff permissions

Single source of truth for what the **Store Staff** admin group can and
can't do. Keep this in sync whenever a permissions migration changes the
group — the actual grants live in
`backend/users/migrations/0008_seed_store_staff_group.py` (initial grant)
and any later migration that adds/removes permissions (see `CHANGELOG.md`).

## Store Staff group

| Area | Can | Can't |
|---|---|---|
| Products | Add, edit, view, **delete** | — |
| Product images | Add, edit, view | Delete |
| Categories | View | Add, edit, delete |
| Orders | View | Edit, delete |
| Shipments | View, edit (advance the fulfilment board) | Delete |
| Support messages | View, reply | — |
| Support threads | View | — |
| Customer reviews | — (moderation is superuser-only) | — |
| Bulk promotions / messaging | — | Everything (hardcoded superuser-only, see `messaging/admin.py`) |

## Hardcoded superuser-only (not group-configurable)

These are locked in `users/admin.py` via `SuperuserOnlyAdmin` regardless of
what a Group grants, because misconfiguring the group would otherwise be a
privilege-escalation or privacy hole:

- **Users** (the customer/staff account list) — staff editing `is_staff` /
  `is_superuser` / permissions on themselves or others would be a
  privilege-escalation hole.
- **Login codes** — one-time OTP codes, never meant to be browsed.

## Changing what staff can do

1. Add a new data migration in `backend/users/migrations/` (don't edit
   `0008_seed_store_staff_group.py` after it's shipped to production — it
   already ran there and won't re-run; ship changes as a new migration
   instead).
2. Update the table above.
3. Add an entry to `CHANGELOG.md`.
