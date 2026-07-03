# Deploying Luxeit (live testing → December launch)

Two managed services, both auto-deploying from this GitHub repo on every push
to `main`:

| Piece                  | Service | Config in repo          |
|------------------------|---------|-------------------------|
| Django API + Postgres  | Render  | `render.yaml`           |
| Next.js app            | Vercel  | `frontend-ui/` root dir |

Deploy the **backend first** — the frontend build prerenders pages by fetching
the API, so it needs a live `BACKEND_ORIGIN`.

---

## 1) Backend on Render (~10 min)

1. Create an account at render.com and connect the GitHub repo.
2. **New → Blueprint** → select this repo. Render reads `render.yaml` and
   creates the `luxeit-api` web service **and** the `luxeit-db` Postgres.
3. Wait for the first deploy (installs deps, `collectstatic`, `migrate`,
   starts gunicorn). The service URL looks like
   `https://luxeit-api.onrender.com` — note it down.
4. Sanity check: open `https://<api-url>/api/health` → `{"status": "ok"}` and
   `https://<api-url>/admin/` → the Jazzmin login page with styling.
5. Create your admin user — service → **Shell** tab:
   `python manage.py createsuperuser`
   (Optional demo data: `python manage.py seed_products`,
   `python manage.py seed_car_catalog`, `python manage.py seed_orders`.)

Costs (see `render.yaml` comments): Starter web $7/mo + Basic Postgres $6/mo,
or both free while testing (web sleeps when idle; free Postgres expires after
30 days).

## 2) Frontend on Vercel (~5 min)

1. Create an account at vercel.com and import the GitHub repo.
2. Set **Root Directory** to `frontend-ui` (framework auto-detects Next.js).
3. Add one environment variable:
   - `BACKEND_ORIGIN` = `https://<your-api>.onrender.com`
4. Deploy. Your app is at `https://<project>.vercel.app`.

## 3) Point the backend at the frontend

In Render → `luxeit-api` → Environment, add:

- `DJANGO_CORS_ALLOWED_ORIGINS` = `https://<project>.vercel.app`
- `DJANGO_CSRF_TRUSTED_ORIGINS` = `https://<project>.vercel.app`

(The browser only talks to Vercel — `/api/*` is proxied server-side to Render —
so these mostly matter for the admin and any direct API access.)

## 4) Real login codes (email)

Codes currently print to the server console. To email them:

1. Create a free resend.com account → get an API key.
2. In Render env vars set:
   - `EMAIL_HOST` = `smtp.resend.com`
   - `EMAIL_PORT` = `587`
   - `EMAIL_HOST_USER` = `resend`
   - `EMAIL_HOST_PASSWORD` = `<your API key>`
   - `DEFAULT_FROM_EMAIL` = `Luxeit <onboarding@resend.dev>` (until you own a domain)
   - `OTP_DELIVERY_CONSOLE` = `False`

Until then, testers' login codes appear in Render → **Logs**.

> Phone-number login needs an SMS gateway (Africa's Talking / Twilio) — not
> wired yet; email login works fully.

## 5) The workflow after setup

- `git push` to `main` → Render and Vercel both build and go live in ~2 min.
- Vercel gives every PR a preview URL; Render keeps deploy history with
  one-click rollback.
- Failed builds never replace the live version.

## December-launch checklist (not needed for testing)

- [ ] Custom domain (point at Vercel; add to `DJANGO_ALLOWED_HOSTS`, CORS, CSRF)
- [ ] Vercel Pro ($20/mo — Hobby tier forbids commercial use)
- [ ] Payments: card + mobile-money aggregator (Flutterwave / DPO / Pesapal)
      — apply for the merchant account early, approval takes weeks
- [ ] SMS OTP + SMS order notifications
- [ ] Postgres backups verified (Render Basic has daily backups)
- [ ] Sentry (or similar) error monitoring
- [ ] Terms of Service + Privacy Policy reviewed by a Zambian lawyer
      (drafted in-app; confirm consumer-protection and Data Protection
      Act, 2021 compliance before launch)
- [ ] Re-enable self-service data export (DATA_EXPORT_ENABLED=True) once
      the flow is finalised, or keep the support-request process

## Local dev — nothing changes

SQLite, console login codes, and `runserver`/`next dev` all keep working
exactly as before. The production behaviour only activates via environment
variables (`DATABASE_URL`, `EMAIL_HOST`, `DJANGO_DEBUG=False`).
