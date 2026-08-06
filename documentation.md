# Real Estate CRM: Daily Progress Log

Quick daily notes on what got done and where things stand. See `frontend-implimentation-plan.md` for full frontend architecture and `implimentation-plan.md` for backend.

---

## Day 3 (evening): Mon, Aug 3, 2026; Phase 1 remaining ~20% close-out

Closed AUTH / LEAD-04/05 / PROP-06 map / PIPE days+tasks / DASH-AG / notifications / DoD against `frontend-implimentation-plan.md` §§7–8 + §13.

**Backend**
- Forgot/reset password + MFA verify stub; `mfa_enabled` + `lead_routing_strategy` on `/me/`.
- `LeadSource` CRUD; tenant routing strategy wired into `capture_lead` / `route_lead`.
- Opportunity `days_in_stage`; property geo `lat/lng/radius_km`; `Listing.co_listing_agent`; `Notification` list + mark-read.

**Frontend**
- Auth: SSO button + `/sso/callback` stub, real forgot/reset, `/mfa`, role onboarding, settings profile/password/MFA.
- NotificationCenter on notifications API; MapSearch (Leaflet radius); amenities + draft/publish; co-listing; agent dashboard tasks/response/goals; Kanban days-in-stage; deal tasks; Excel export; sources/routing off localStorage.

**DoD**
- Vitest unit suite (`status`, `roles`, `format`, `csv`) — 7/7 green.
- Playwright smoke (`e2e/lead-loop.spec.ts`): login → capture → convert → Kanban move with reason — green.
- Backend `tests/test_phase1_closeout.py` (auth/MFA/sources/routing/geo/notifications) — green.
- i18n skeleton for shell nav; a11y focus rings + aria-labels on shell/login; `npm run lint` + `npm run build` clean.

**§8.7 acceptance** — capture → convert → Kanban green; Phase 2 modules not claimed.

---

## Day 3 (continued): Mon, Aug 3, 2026; Phase 1 Wave A close-out

Finished remaining Phase 1 gaps against plan §8 so MVP acceptance is green end-to-end.

**Foundation / polish**
- ConfirmDialog, ErrorBoundary, 403/404, RequireRole; RHF+Zod on Capture Lead, Contact, Property, Create Deal.
- Settings deep routes (`/settings/:section` → `?tab=`), pipeline `/sales` & `/leasing`, forecast period + lost-reason chart.
- Auth stubs: reset password + onboarding routes.

**Module gaps closed**
- Role dashboards split per plan (SA / OW / MG / AG / PM / MK / FN / PU).
- Leads: assignee filter, assign via `/users` + `assign` action, analytics date range.
- Contacts: CSV import dedupe preview (CRM + in-file) with skip option.
- Properties: media cover + reorder (listing `custom_fields`), owner/mandate editor on detail.
- Pipeline: keyboard/select + stage-button move (alongside drag).
- Backend: `GET /users/`, `POST /leads/{id}/assign/`; custom_fields validator allows free-form when no FieldDefinitions (and system keys `image_url` / `media_order` / `cover_media_id`).

**Verification**
- `npm run build` and `npm run lint` clean.

**Acceptance checklist (plan §8.7)** — all checked for Phase 1 MVP UI against living API.

**Next (Phase 2)**
- Calendar/tasks, unified inbox, marketing campaigns, leases, documents — see plan §9.

---

## Day 3: Mon, Aug 3, 2026; Phase 1 frontend complete

Implemented the full Phase 1 MVP frontend against the living API, per `frontend-implimentation-plan.md` §8 and the design system in `ui-ux-design-principle-coloring.md`.

**Foundation**
- Design tokens standardized on blue-600 brand with HSL CSS variables (light/dark), semantic + entity accents.
- Role-aware AppShell: grouped sidebar via `navByRole`, ScopeBadge, Cmd+K command palette, global search, notification center stub, mobile FAB, theme toggle.
- Shared library: DataTable (column toggle + saved views), StatCard, ActivityTimeline (channel borders), CSV parse/export, StatusBadge matrix.

**Phase 1 modules**
- **Dashboards** — widget sets by role (agent/manager/owner, property manager, marketing, finance).
- **Leads** — inbox with quick tabs + filters, capture with live duplicate warning, detail sheet (overview / timeline / duplicates), analytics, routing preferences, source catalog, merge-duplicates dialog.
- **Contacts** — role chips + VIP, 360 sheet (details / timeline / related), merge dialog, CSV import wizard, export.
- **Properties** — grid/table toggle, detail page with media upload + status history, project tree, advanced search, listing analytics.
- **Pipeline** — multi-pipeline Kanban, mandatory reason + next action on move, create/deal detail sheets, won/lost views, weighted forecast.
- **Settings** — profile, notifications prefs, custom fields, org hierarchy CRUD, role matrix, security.
- **Reports hub** — shortcuts to live analytics surfaces.
- **Auth** — login + forgot-password UX.

**Verification**
- `npm run build` and `npm run lint` clean. Heavier routes code-split via `React.lazy`.

**Acceptance checklist (plan §8.7)**
- [x] Capture lead → SLA badge → convert → Kanban move with reason
- [x] Contact 360 with roles + timeline
- [x] Property grid + status transitions + media upload UI
- [x] Role dashboards render correct widget sets
- [x] DataTables support saved views
- [x] Scope badge + dark mode + StatusBadge
- [x] Mobile: sidebar drawer + FAB quick create

**Next (Phase 2)**
- Calendar/tasks, unified inbox, marketing campaigns, leases, documents — see plan §9.

---

## Day 1: Thu, Jul 23, 2026; Backend Build & Infrastructure Setup

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

## Day 2: Fri, Jul 24, 2026; DevOps, Deployment & Frontend Polish

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
- Phase 1 MVP is almost done. Core API and screens work. Next: finish remaining end-to-end flows, media uploads in production, and refine lead routing/scoring logic.
