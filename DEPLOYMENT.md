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

## Abuse protection & scaling (already built in)

- **Rate limits:** global ceilings per client (anon 300/min, signed-in 240/min,
  tunable via `DRF_ANON_RATE` / `DRF_USER_RATE`) plus tight per-action limits —
  login codes 10/min per IP & 5/hour per destination, order creation 30/hour,
  reviews 20/hour, support messages 60/hour. Reads are never throttled.
- **Client identification:** `DJANGO_NUM_PROXIES=1` on Render keys anon limits
  to the real client IP behind the load balancer.
- **Bounded responses:** product list capped at 300 rows per request.
- **Serving:** gunicorn 2 workers × 4 threads per instance; DB connections
  pooled (`conn_max_age`); Next.js caches catalogue reads for 5 minutes, which
  shields Django from most public traffic.

**Login & account protection:**
- Login codes: hashed, 10-min expiry, max 5 wrong attempts per code, old codes
  invalidated on reissue; per-IP and per-destination request caps.
- **Global OTP circuit breaker** (`OTP_GLOBAL_HOURLY_CAP`, default 500/hour):
  even a distributed flood cannot run up the email/SMS bill — past the cap the
  system stops sending codes and logs a CRITICAL line.
- **Admin login lockout** (django-axes): 5 failed password attempts locks that
  IP+account combination for 1 hour. Lockout history is visible in the admin
  under "Axes" → Access attempts.

**The 3am playbook** (someone is flooding an endpoint right now):
1. Open Render → luxeit-api → Logs. Repeated 429s mean the rate limits are
   already absorbing it — usually nothing else needed.
2. To hard-block the source: copy the attacker IP(s) from the logs, set
   `DJANGO_BLOCKED_IPS=1.2.3.4,5.6.7.8` in Render → Environment → Save.
   The service restarts (~30s) and those IPs get an instant 403 with zero
   processing cost. Remove them later the same way.
3. If codes/emails are the target, the circuit breaker has already capped the
   damage; look for the "OTP circuit breaker OPEN" log line.
4. For a true volumetric DDoS (millions of requests), app-level defences are
   the wrong layer — put **Cloudflare** (free plan) in front of the custom
   domain at launch: DDoS absorption, WAF, per-IP rules and country blocks at
   the edge, before traffic ever reaches Render.

When real traffic grows (thousands of daily users), in order:
1. Move the throttle/cache store to **Redis** (Render Key Value) — counters are
   currently per-process, which is fine at 1–2 instances.
2. Scale **Render instances** horizontally (the app is stateless).
3. Upgrade Postgres plan; add read replicas only if reports show DB pressure.
4. Load-test with something like `locust` before big marketing pushes.

## Local dev — nothing changes

SQLite, console login codes, and `runserver`/`next dev` all keep working
exactly as before. The production behaviour only activates via environment
variables (`DATABASE_URL`, `EMAIL_HOST`, `DJANGO_DEBUG=False`).
