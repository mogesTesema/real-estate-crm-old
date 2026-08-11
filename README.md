# Real Estate CRM

Single-company real estate CRM — **Phase 1 (MVP Foundation)**.
Django + DRF + PostgreSQL + Celery backend; React + TypeScript + Vite frontend.
See `architecture.md` for the data model and `full-featured-web-based-real-estate-crm-srs.md` for requirements.

**Scope:** one brokerage/agency (multi-branch / multi-team inside that company). **Not** a multi-company SaaS product. In this system, **tenant** means a **rental tenant** (lease party), not a software customer.

## What's built (Phase 0 + Phase 1)

- **Role-based access + row-level scoping** — `own / branch / all` visibility per role within the company, built into a base viewset every module inherits.
- **Custom fields** — JSONB + `FieldDefinition` metadata, no migrations for ad-hoc company fields.
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
docker compose exec backend python manage.py seed_demo   # demo company users + data

# Frontend
cd frontend && npm install && npm run dev
```

- API:        http://localhost:8000/api/v1/
- API docs:   http://localhost:8000/api/docs/  (Swagger, drives frontend type-gen)
- Frontend:   http://localhost:5173/
- Demo login: `admin@demo.test` / `demo12345`

## Test & lint

```bash
docker compose run --rm backend pytest        # scoping, services, domain tests
docker compose run --rm backend ruff check .
cd frontend && npm run build                  # tsc + vite
```

## Layout

```
backend/   Django project (config/) + domain apps (apps/core, contacts, properties,
           leads, deals, activities, integrations)
frontend/  React + TS SPA (features/, components/, lib/)
deploy/    postgres-init.sql and related deploy helpers
```
