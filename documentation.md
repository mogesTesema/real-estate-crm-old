this is daily documentation that helps us to navigate easly across what we have done each day.

---

## Day 3 — Thu, Jul 23, 2026 — Foundation + Phase 1 MVP build

Went beyond the planned "data model design" and stood up a working, tested slice of
the whole MVP. See `implimentation-plan.md` for the architecture.

**Backend (Django + DRF + Postgres + Celery)**
- Scaffold: `config/` settings split, docker-compose (Postgres+PostGIS, Redis, MinIO),
  Dockerfile, CI, ruff, pytest.
- `apps/core`: multi-tenancy via **Postgres RLS** (non-superuser app role `crm_app`,
  FORCE'd policies keyed to `app.current_tenant`), custom User + org hierarchy,
  JWT auth, **RBAC + row-level scoping** base viewset, custom-field engine (JSONB +
  FieldDefinition), audit log, integration adapters (console SMS/email).
- Domain apps: `contacts` (roles-as-a-set, dedupe + merge), `properties`
  (Property/Listing split, status state machine + history, media upload), `leads`
  (capture → dedupe → route → score → SLA sweep → ack → convert), `deals`
  (Pipeline/Stage/Opportunity, Kanban board API, mandatory-reason stage moves),
  `activities` (polymorphic timeline).
- `seed_demo` management command for the stakeholder demo.

**Frontend (React + TS + Vite)**
- Auth (JWT), layout/nav, TanStack Query hooks, reusable DataTable, and screens for
  Dashboard, Leads, Contacts, Properties, and the Kanban Pipeline (with reason modal).

**Verified**
- 21 backend tests pass: RLS isolation (ORM + raw SQL + bypass-manager + insert reject),
  API row-level scoping, dedupe/merge, lead engine, both state machines.
- Live HTTP E2E: login → capture lead (scored/assigned/SLA) → dedupe → convert →
  stage move (400 without reason, 200 with) → Kanban board. `ruff` clean.

**Notes / decisions**
- RLS requires the app to connect as a **non-superuser** (`crm_app`, created by
  `deploy/postgres-init.sql`); superusers bypass RLS.
- Background jobs (SLA sweep) have no request tenant, so they **iterate tenants** and
  bind each — an unscoped sweep correctly sees nothing (isolation proven).
- Deferred per plan: Elasticsearch (Postgres FTS for now), public portal, real
  Twilio/SendGrid, AI features.

---

## Day 4 — Fri, Jul 24, 2026 — Frontend Rebuild, DevOps & Deployments

### Frontend rebuild + staging prep (Vercel + Render + Neon)

**Backend config for deploy**
- Neon Postgres wired via `DATABASE_URL` (dj-database-url). **Critical:** Neon's
  `neondb_owner` has BYPASSRLS → created a dedicated **`crm_app`** role (non-bypassrls) so
  tenant RLS is actually enforced; verified isolation on Neon. `-pooler` host auto-rewritten
  to the direct endpoint (session GUCs don't survive the transaction pooler).
- Single-service ready: locmem cache (no Redis), Celery optional, SLA sweep via
  `manage.py sweep_sla`. Prod settings: CORS, ALLOWED_HOSTS, WhiteNoise.
- **Tests never hit Neon**: `config/settings/test.py` + `pytest.ini --ds` force local
  Postgres. 21 tests still green; ruff clean.

**Frontend — full rebuild (design system + full CRUD)**
- Design tokens (indigo/emerald/amber/red, light+dark, Inter), shadcn-style components on
  Radix, react-hook-form, dnd-kit Kanban (real drag + reason modal), recharts dashboard,
  sonner toasts, lucide icons. Loading skeletons, empty states, responsive, code-split.
- Full CRUD: Leads (capture/convert/respond), Contacts (roles/delete), Properties (image
  cards, create/edit, listing status state machine), Pipeline, Settings (custom fields CRUD).
- `npm run build` + `npm run lint` clean. Neon seeded with realistic demo data
  (agents, 22 contacts, 10 properties w/ photos, 12 leads incl. SLA breaches, 9 deals).

**Deploy artifacts:** `render.yaml` (single web service), `frontend/vercel.json`,
`DEPLOY.md` (step-by-step). Actual deploy = user pushes to GitHub + connects Render/Vercel.

### DevOps & Deployment Completion

**CI/CD & Testing (GitHub Actions)**
- Fixed the automated testing workflow to correctly enforce Row-Level Security (RLS).
- **The Issue:** The default Postgres Docker image creates a `SUPERUSER`, which inherently bypasses all RLS policies, causing isolation tests to fail.
- **The Fix:** Implemented a two-role strategy in `ci.yml`. The `postgres` user acts as the bootstrap superuser to create the database, and a separate `crm` role is created as a `NOSUPERUSER` with `CREATEDB` privileges. Django connects as the `crm` user, ensuring RLS policies are strictly enforced during `pytest` runs. Tests are now green in CI.

**Backend Deployment (Render)**
- Backend is successfully deployed and live on Render.
- Environment variables configured: `DATABASE_URL` (Neon), `DJANGO_SETTINGS_MODULE` (prod), `FRONTEND_ORIGIN`, and `CORS_ALLOWED_ORIGINS` to allow requests from the Vercel frontend.
- **API Documentation:** Verified Swagger UI is accessible at `/api/docs/` and added a ReDoc endpoint at `/api/redoc/` for comprehensive API reference.

**Frontend Deployment (Vercel)**
- Frontend is successfully deployed and live on Vercel.
- Connected the frontend to the live backend by setting the `VITE_API_URL` environment variable in Vercel to point to the Render backend URL. Full-stack integration is complete and functional.
