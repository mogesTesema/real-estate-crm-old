# Real Estate CRM — Daily Progress Log

This is our daily documentation. Each entry records what got done, how it was done, and where we left off so anyone picking up the project knows exactly what's going on.

---

## Day 2 — Thu, Jul 23, 2026 — Backend Build & Infrastructure Setup

Set up the entire development environment and built the core backend from scratch. This covered the planned "Environment & Infrastructure" sprint day plus a big chunk of the Phase 1 MVP features ahead of schedule.

**Infrastructure & Scaffold**
- Created the Django project with a split settings structure (`config/settings/base.py`, `dev.py`, `prod.py`, `test.py`).
- Set up `docker-compose` with Postgres+PostGIS, Redis, and MinIO for local development.
- Wrote the `Dockerfile` for production deployment (gunicorn on port 8000).
- Configured linting (ruff) and testing (pytest) tooling.

**Core App (`apps/core`)**
- Built multi-tenant isolation using **Postgres Row-Level Security (RLS)** — the app connects as a non-superuser role (`crm_app`) so `FORCE ROW LEVEL SECURITY` policies are actually enforced. Tenant is bound via the `app.current_tenant` session GUC.
- Custom `User` model with org hierarchy: Tenant → Company → Branch → User.
- JWT authentication (SimpleJWT) with token obtain/refresh endpoints.
- **RBAC + row-level scoping** base viewset — agents see only their own records, managers see their branch, owners see everything within the tenant.
- Custom-field engine using JSONB + a `FieldDefinition` metadata table so tenants can add fields without schema migrations.
- Audit logging and pluggable integration adapters (console SMS/email providers that can be swapped for Twilio/SendGrid later).

**Domain Apps**
- `contacts` — CRUD with roles-as-a-set (one person can be buyer + seller), deduplication engine, and merge functionality.
- `properties` — Property/Listing split (physical asset vs. marketing instance), listing status state machine with history tracking, media upload to object storage.
- `leads` — Full pipeline: capture → dedupe → route (round-robin) → score → SLA breach sweep → auto-acknowledge → convert to deal.
- `deals` — Pipeline/Stage/Opportunity models, Kanban board API, mandatory reason capture on stage moves.
- `activities` — Polymorphic timeline (calls, notes, emails attachable to any entity).
- `seed_demo` management command to populate realistic demo data.

**Frontend (React + TypeScript + Vite)**
- Auth flow (JWT login/logout), app shell with sidebar navigation.
- TanStack Query hooks for all API calls, reusable DataTable component.
- Screens for Dashboard, Leads, Contacts, Properties, and Pipeline (Kanban with drag-and-drop + reason modal).

**Testing (21 tests passing)**
- RLS isolation: ORM filtering, raw SQL, bypass-manager, and insert-without-tenant rejection.
- API row-level scoping across roles (agent/manager/owner/cross-tenant).
- Deduplication, merge, lead engine, and both state machines (listing + deal).
- Live E2E walkthrough: login → capture lead → dedupe → convert → stage move (400 without reason, 200 with) → Kanban board.

**Key Decisions**
- RLS requires connecting as a **non-superuser** — superusers silently bypass all policies.
- Background jobs (SLA sweep) iterate tenants explicitly and bind each one; an unscoped sweep correctly sees nothing.
- Deferred for later: Elasticsearch (using Postgres FTS for now), public portal, real Twilio/SendGrid, AI features.

---

## Day 3 — Fri, Jul 24, 2026 — DevOps, Deployment & Frontend Polish

Focused on getting the full stack deployed and accessible online, fixing the CI pipeline, and completing the frontend rebuild with a proper design system.

**Frontend Rebuild (Design System + Full CRUD)**
- Built a complete design system: color tokens (indigo/emerald/amber/red), light + dark mode, Inter font, shadcn-style components on Radix primitives.
- Added react-hook-form for all forms, dnd-kit for real Kanban drag-and-drop with reason modal, recharts for dashboard charts, sonner for toast notifications, lucide for icons.
- Loading skeletons, empty states, responsive layouts, and code-splitting throughout.
- Full CRUD on all modules: Leads (capture/convert/respond), Contacts (roles/delete), Properties (image cards, create/edit, listing status changes), Pipeline, Settings (custom fields CRUD).
- `npm run build` and `npm run lint` both clean.

**Backend Deploy Config (Render + Neon)**
- Wired Neon Postgres via `DATABASE_URL` using dj-database-url. The `-pooler` host is auto-rewritten to the direct endpoint because session GUCs (needed for RLS) don't survive Neon's transaction pooler.
- **Critical finding:** Neon's default `neondb_owner` role has `BYPASSRLS=true`, which would silently disable tenant isolation. Created a dedicated `crm_app` role without bypass privileges and verified RLS enforcement on Neon.
- Made the app single-service friendly: locmem cache when Redis isn't available, Celery optional (SLA sweep runs via `manage.py sweep_sla`).
- Prod settings: CORS origins, `ALLOWED_HOSTS`, WhiteNoise for static files.
- Tests never touch Neon — `config/settings/test.py` forces local Postgres.

**CI/CD Fix (GitHub Actions)**
- All 4 RLS isolation tests were failing in CI because the Postgres Docker container creates `POSTGRES_USER` as a superuser, which bypasses RLS.
- First tried `ALTER ROLE crm NOSUPERUSER` but that fails because the bootstrap user can't demote itself.
- **Final fix:** Two-role strategy in `.github/workflows/ci.yml`. Container starts with `postgres` as the bootstrap superuser. A setup step then creates a separate `crm` role as `NOSUPERUSER` with `CREATEDB`, transfers database ownership, and grants schema access. Django connects as `crm`, so RLS is enforced. All 21 tests now pass in CI.

**Backend Deployment (Render) — Live**
- Backend deployed and running at `https://real-estate-crm-rfvc.onrender.com`.
- Environment variables set: `DATABASE_URL`, `DJANGO_SETTINGS_MODULE=config.settings.prod`, `DJANGO_SECRET_KEY`, `FRONTEND_ORIGIN`, `CORS_ALLOWED_ORIGINS`.
- API docs live at `/api/docs/` (Swagger UI) and `/api/redoc/` (ReDoc). Raw schema at `/api/schema/`.

**Frontend Deployment (Vercel) — Live**
- Frontend deployed at `https://real-estate-crm-umber-seven.vercel.app`.
- Set `VITE_API_URL` in Vercel environment variables pointing to the Render backend URL so the frontend knows where to send API requests.
- Full-stack integration verified — frontend and backend are communicating successfully.

**Demo Data**
- Neon seeded with realistic data: multiple agents, 22 contacts, 10 properties with photos, 12 leads (including SLA breaches), and 9 deals across pipeline stages.

**Where We Left Off**
- Phase 1 MVP is roughly 60% complete. The backend API and frontend screens are functional for all core modules.
- Next up: finish wiring remaining CRUD flows end-to-end, implement media upload in the deployed environment, and start on lead routing/scoring business logic refinements.
