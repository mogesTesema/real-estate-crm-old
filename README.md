# Real Estate CRM

Multi-tenant real estate CRM — **Phase 1 (MVP Foundation)**.
Django + DRF + PostgreSQL + Celery backend; React + TypeScript + Vite frontend.
See `implimentation-plan.md` for the full architecture and roadmap.

## What's built (Phase 0 + Phase 1)

- **Multi-tenancy with Postgres Row-Level Security** — every business row carries a
  `tenant_id`; RLS (FORCE'd, app connects as a non-superuser role) makes a forgotten
  `WHERE` a bug, not a data breach. Proven by the tenancy test suite.
- **RBAC + row-level scoping** — `own / branch / all` visibility per role, built into
  a base viewset every module inherits.
- **Custom fields** — JSONB + `FieldDefinition` metadata, no migrations per tenant.
- **Audit log**, **soft delete**, **integration adapters** (console SMS/email stubs).
- **Contacts** (roles-as-a-set, dedupe + merge), **Properties/Listings** (split, status
  state machine + history, media upload), **Leads** (capture → dedupe → route → score →
  SLA sweep → acknowledge → convert), **Pipeline** (Opportunities, Kanban board,
  mandatory-reason stage moves), **unified activity timeline**.
- **Frontend**: auth, dashboard, and list/board screens for leads, contacts,
  properties, and the pipeline.

## Run it

```bash
# Backend + infra (Postgres+PostGIS, Redis, MinIO, API, Celery worker/beat)
docker compose up -d
docker compose exec backend python manage.py seed_demo   # demo tenant + data

# Frontend
cd frontend && npm install && npm run dev
```

- API:        http://localhost:8000/api/v1/
- API docs:   http://localhost:8000/api/docs/  (Swagger, drives frontend type-gen)
- Frontend:   http://localhost:5173/
- Demo login: `admin@demo.test` / `demo12345`

## Test & lint

```bash
docker compose run --rm backend pytest        # 21 tests: RLS isolation, scoping, services
docker compose run --rm backend ruff check .
cd frontend && npm run build                  # tsc + vite
```

## Layout

```
backend/   Django project (config/) + domain apps (apps/core, contacts, properties,
           leads, deals, activities, integrations)
frontend/  React + TS SPA (features/, components/, lib/)
deploy/    postgres-init.sql (creates the non-superuser app role for RLS)
```
