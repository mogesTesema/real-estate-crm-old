this is daily documentation that helps us to navigate easly across what we have done each day.

---

## Day 3 — Fri, Jul 24, 2026 — Foundation + Phase 1 MVP build

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

## Frontend rebuild + staging prep (Vercel + Render + Neon)

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
