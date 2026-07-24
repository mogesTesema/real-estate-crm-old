# Real Estate CRM — Daily Progress Log

Quick daily notes on what got done and where things stand. See `implimentation-plan.md` for the full architecture.

---

## Day 1 — Thu, Jul 23, 2026 — Backend Build & Infrastructure Setup

Built the backend from scratch and got the first working slice of the MVP running locally.

**What got done**
- Set up the Django project with split settings (dev/prod/test), Docker Compose (Postgres, Redis, MinIO), Dockerfile, and CI pipeline.
- Implemented tenant isolation using Postgres Row-Level Security — each tenant's data is locked down at the database level, not just in app code. The app connects as a non-superuser so RLS is actually enforced.
- Built the user system with org hierarchy (Tenant → Company → Branch → User) and JWT auth.
- Added role-based access control: agents see only their own stuff, managers see their branch, owners see everything in their tenant.
- Built all the domain modules — contacts (with dedup and merge), properties (with listing status tracking), leads (capture → route → score → SLA alerts → convert), deals (pipeline stages with Kanban API), and an activity timeline.
- Scaffolded the React frontend with login, dashboard, and pages for each module.
- Wrote 21 backend tests covering RLS isolation, scoping, dedup, and state machines. All passing.

**Key decisions**
- RLS needs a non-superuser DB role — superusers silently skip all policies.
- Background jobs (like SLA sweep) loop through tenants one by one since there's no HTTP request to pull a tenant from.
- Deferred: Elasticsearch, public portal, Twilio/SendGrid, AI features.

---

## Day 2 — Fri, Jul 24, 2026 — DevOps, Deployment & Frontend Polish

Got the full stack deployed and accessible online. Fixed the CI pipeline that was failing due to an RLS issue.

**Frontend rebuild**
- Rebuilt the frontend with a proper design system (dark/light mode, shadcn-style components, recharts dashboard, drag-and-drop Kanban).
- Full CRUD working on all modules: Leads, Contacts, Properties, Pipeline, and Settings.

**CI/CD fix**
- Tests were failing in GitHub Actions because the Postgres Docker container makes its user a superuser, which bypasses RLS. Tried demoting the user but Postgres doesn't allow a bootstrap user to demote itself.
- Fixed it with a two-role setup: container starts with `postgres` as superuser, then a setup step creates a separate `crm` role without superuser privileges. Django connects as `crm`, RLS kicks in, tests pass.

**Deployed to production**
- Backend live on Render (`real-estate-crm-rfvc.onrender.com`). Configured env vars for Neon DB, CORS, and the frontend origin.
- Frontend live on Vercel (`real-estate-crm-umber-seven.vercel.app`). Connected to the backend via `VITE_API_URL`.
- Neon DB note: the default `neondb_owner` role has `BYPASSRLS`, so we created a dedicated `crm_app` role without it. Also rewrote the `-pooler` host to direct connections since session variables don't survive the transaction pooler.
- API docs available at `/api/docs/` (Swagger) and `/api/redoc/` (ReDoc).
- Seeded the database with demo data: agents, 22 contacts, 10 properties, 12 leads, 9 deals.

**Where things stand**
- Phase 1 MVP is about 60% done. Core API and screens work. Next: finish remaining end-to-end flows, media uploads in production, and refine lead routing/scoring logic.
