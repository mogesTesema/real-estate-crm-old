# Deploy — Staging (Vercel + Render + Neon)

Frontend → **Vercel**, backend → **Render** (single free web service), database → **Neon**.

## Prerequisites (already done in this repo)
- Neon has a **`crm_app`** role (NON-superuser, NON-bypassrls) — the app connects as this so
  Row-Level Security is enforced. `neondb_owner` must NOT be used (it bypasses RLS).
- Neon is migrated and seeded with the demo tenant (`admin@demo.test` / `demo12345`).

## 1. Backend on Render
1. Push this repo to GitHub.
2. Render → **New → Blueprint**, pick the repo. It reads `render.yaml` and creates the
   `estatecrm-api` web service (Docker).
3. Set the two secret env vars (Dashboard → the service → Environment):
   - `DATABASE_URL` = the **crm_app** Neon URL, e.g.
     `postgresql://crm_app:PASSWORD@ep-...-pooler.<region>.aws.neon.tech/neondb?sslmode=require`
     (the app rewrites `-pooler` to the direct host automatically).
   - `FRONTEND_ORIGIN` = your Vercel URL (fill in after step 2, then redeploy) —
     e.g. `https://estatecrm.vercel.app`.
4. Deploy. `preDeployCommand` runs migrate + collectstatic + seed_demo (idempotent).
5. Note the service URL, e.g. `https://estatecrm-api.onrender.com`.
   Verify: open `https://estatecrm-api.onrender.com/api/docs/`.

> Free-tier caveats: the service cold-starts (~30–50s) after inactivity, and free Neon may
> sleep — the first request in a while is slow. Upgrade to paid to remove this before a
> high-stakes client meeting.

## 2. Frontend on Vercel
1. Vercel → **New Project** → import the repo.
2. Set **Root Directory** = `frontend`. Framework preset: Vite (auto).
3. Add env var `VITE_API_URL` = your Render URL (no trailing slash), e.g.
   `https://estatecrm-api.onrender.com`.
4. Deploy. Note the URL, e.g. `https://estatecrm.vercel.app`.
5. Go back to Render, set `FRONTEND_ORIGIN` to that URL, and redeploy the backend (CORS).

## 3. Smoke test
Open the Vercel URL → sign in with `admin@demo.test` / `demo12345` → dashboard should be
populated → capture a lead → drag a deal in the pipeline (reason modal) → toggle dark mode.

## 4. (Optional) SLA sweep
There is no Celery on the single-service plan. To flag SLA breaches on a schedule, point a
free external cron (e.g. cron-job.org) at a small endpoint or use Render's Cron Job add-on to
run `python manage.py sweep_sla`.

## Property photo uploads
The demo shows property images via URL (works with no storage service). To enable **file
uploads**, set `AWS_STORAGE_BUCKET_NAME` + `AWS_*` env vars to a Cloudflare R2 / S3 bucket on
Render; the listing media endpoint (`/api/v1/listings/{id}/media/`) then stores files there.
