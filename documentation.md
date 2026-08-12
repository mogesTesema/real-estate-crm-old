# Real Estate CRM: Daily Progress Log

Quick daily notes on what got done and where things stand. See `frontend-implimentation-plan.md` for full frontend architecture and `implimentation-plan.md` for backend.

**Current state (as of Wed, Aug 12, 2026):** Role-based frontend fulfillment is live for demos and aligned with the latest architecture decisions. All 8 roles have live sidebars, role-specific dashboards, and navigable modules. Live API modules (leads/contacts/properties/pipeline) remain wired; leases/finance/marketing/portal/admin use an in-browser demo-data layer with per-resource isolation. Seed every role via `python manage.py seed_demo --reset` - password `demo12345` for all.

**Demo logins**
| Email | Role |
| :--- | :--- |
| `superadmin@demo.test` | Super Admin |
| `owner@demo.test` / `admin@demo.test` | Broker / Owner |
| `manager@demo.test` | Branch Manager |
| `agent1@demo.test` | Sales Agent |
| `pm@demo.test` | Property Manager |
| `marketing@demo.test` | Marketing |
| `finance@demo.test` | Finance |
| `portal@demo.test` | Portal User |

---

## Day 11: Wed, Aug 12, 2026; Dashboard hardening, routing polish, and test depth

Closed today with production-facing frontend polish and confidence checks, then pushed as three dated commits.

**What got done**
- Expanded role-specific dashboard workspaces in `frontend/src/features/dashboard/DashboardPage.tsx` so each role sees focused actions and KPIs.
- Wired role-aware app entry/routing and login touchpoints across `frontend/src/App.tsx`, `frontend/src/features/auth/LoginPage.tsx`, `frontend/src/lib/roles.ts`, and `frontend/src/lib/status.ts`.
- Strengthened test coverage for lead loops and scoped behavior in `frontend/e2e/lead-loop.spec.ts` and `frontend/src/lib/__tests__/unit.test.ts`.
- Published the Day 11 slice as 3 commits:
  - `d861211` - role-aware routing + auth entry
  - `8cece1a` - role-specific dashboard workspaces
  - `74e5dab` - unit + e2e lead workflow coverage

---

## Day 10: Tue, Aug 11, 2026; Docs alignment, seed depth, demo data foundation, module pages

Consolidated the big role-demo and architecture-aligned frontend foundation and pushed as five dated commits.

**What got done**
- Updated project docs to match delivered role-aware direction:
  - `README.md`
  - `documentation.md`
  - `frontend-implimentation-plan.md`
  - `ui-ux-design-principle-coloring.md`
  - `Real Estate CRM Complete User Role Definitions.md`
- Strengthened demo seeding for role walkthrough reliability in `backend/apps/core/management/commands/seed_demo.py`.
- Added reusable frontend demo-data foundation in `frontend/src/lib/demo/` (`fixtures`, `store`, `hooks`, scoped access helpers, export index).
- Added shared module surfaces and pages:
  - `frontend/src/components/ModuleDashboard.tsx`
  - `frontend/src/components/ResourceListPage.tsx`
  - `frontend/src/features/modules/CalendarPage.tsx`
  - `frontend/src/features/modules/CommsPage.tsx`
  - `frontend/src/features/modules/ModulePages.tsx`
  - plus shell support in `frontend/src/components/AppShell.tsx`
- Published the Day 10 slice as 5 commits:
  - `705bb05` - docs alignment
  - `01a1b03` - role definitions refinement
  - `0b8ccaa` - demo seed strengthening
  - `f557289` - demo data access layer
  - `891c4e1` - module workspace shells/resource pages

---

## Role isolation model

Frontend demo modules enforce a written **all / own** resource-access contract in `frontend/src/lib/demo/access.ts`. Every sensitive demo resource declares:

- `roles` — who may read the resource at all (everyone else gets zero rows)
- `ownerScoped` + `allScopeRoles` — whether remaining roles see every row or only rows tagged `ownerEmail === me.email`

`useScopedDemoList` applies that rule for the signed-in user. `ResourceListPage` and role dashboards/modules must use it (not raw `useDemoList`) for any identity-sensitive list.

**Domain split (do not merge):**
- Finance AR ledger = `invoices` / `transactions` / `commissions`
- Property Manager rent roll = `rentInvoices` / `payments` / `leases` / `workOrders`
- Portal customer = `portalDeals` / `favorites` / `savedSearches` (+ own-tagged lease/calendar/docs)

**Route guard:** `canAccess` in `frontend/src/lib/roles.ts` is an explicit most-specific-path table with **default deny**. Action buttons that mutate money or rental-tenant records wrap with `<Can roles={[...]}>` from `RequireRole.tsx`.

**Out of scope for this pass:** backend API endpoint allowlists / object-level RBAC are role-scoped within the company but not yet action-hard; real finance/lease/maintenance models are still frontend-demo only.

**Product scope:** single real estate company (not SaaS). **Tenant** = rental tenant only.

---

## Day 9: Mon, Aug 10, 2026; Role-based frontend fulfillment

Unlocked every sidebar item from the role/dashboard design docs and made each role land on its own dashboard for the frontend showcase.

**What got done**
- Extended `seed_demo` with one user per missing role (super_admin, manager, property_manager, marketing, finance, portal) plus `owner@demo.test` alias.
- Added `frontend/src/lib/demo/` fixtures + zustand store + `useDemoList` / `useScopedDemoList` hooks for modules without backend endpoints.
- Rewrote `ROLE_NAV` — removed `lockedPhase`; every item is a live route. Rebuilt `ROUTE_ROLES` / `canAccess` as explicit default-deny paths.
- Split Property Manager `rentInvoices` from Finance `invoices`; identity-tagged commissions/messages/calendar/portal rows.
- Built `ResourceListPage` + `ModuleDashboard` scaffolds; shipped Calendar, Communications timeline (channel colors), Documents, Team, Leases, Tenants, Rent, Maintenance, Finance, Marketing, Portal, Super Admin, and Help pages.
- Role dashboards rebuilt with doc-aligned widgets (Owner agency/revenue/team split, Super Admin quick actions, Finance pending payments, Marketing campaign budget, Portal notifications).
- Wired `<Can>` around approve/void/export/renew/assign/budget/suspend actions.
- Updated Vitest route-denial + demo-scope matrix; Playwright isolation checks (portal `/403`, agent commission self-only).

**Verification**
- Run `seed_demo --reset`, then log in as each role from the login quick-fill.
- `npm test` (Vitest) for nav/canAccess/scope; Playwright role dashboard + isolation smokes when stack is up.

---

## Day 8: Sun, Aug 9, 2026; Role navigation, dashboards, tests & docs

Finished the design-doc alignment by shipping role-grouped navigation, dashboard close-out, and verification.

**What got done**
- Refactored `roles.ts` to per-role `ROLE_NAV` groups matching the dashboard design doc; unbuilt modules render as locked Phase-N stubs (no dead routes). Manager sidebar derived from the role-definitions activity list (doc 2 has no manager section).
- AppShell renders group headers + lock affordance; CommandPalette flattens live items only.
- Split dashboard widgets into `features/dashboard/widgets.tsx` (`StubPanel`, `GoalProgressCard`, `SalesPipelineCard`, `FollowUpsDue`); each role dashboard filled with live KPIs plus honest Phase 2–4 stub panels.
- Expanded Vitest coverage for status tones and grouped nav; Playwright smoke updated for new nav labels + locked-item check.
- Documented Day 7–8 work and a design-doc conformance register.

**Verification**
- `npm run lint`, `npm run build`, `npm test` (Vitest) green.

### Design-doc conformance register

**ui-ux-design-principle-coloring.md**
- Palette / semantic / entity tokens — implemented (light + dark).
- Under-offer / reserved listing tones — implemented.
- Single `--muted-foreground` retained (doc also lists a separate secondary #475569) — documented deviation.
- Kanban card/column/drag-drop — implemented.
- Data tables sticky header / h-12 / row hover / 450px sheet — implemented.
- Status chips via StatusBadge — implemented.
- 3-second scan (Status / Owner / Budget|Price / Next Action) — implemented on contact, lead, property.
- Omnichannel timeline borders — implemented.
- Dimensional skeletons (Kanban/table/StatCard) — implemented for primary surfaces.
- 44px touch targets + focus rings — implemented on shell, FAB, row actions, Kanban drag handle.
- Bottom action sheet entries (call / upload) — implemented via MobileFab context items.

**Real-Estate-CRM-Role-Based-Dashboard Designs.md**
- Per-role sidebar groups — implemented with live routes where Phase 1 exists.
- Unbuilt modules shown as locked Phase-N stubs — implemented (no dead routes).
- Manager sidebar missing in doc 2 — derived from doc 3 activities (branch reports, routing, KPI, inventory) — documented derivation.
- Dashboard widgets as named doc-2 group items — live KPIs + StubPanels for Phase 2+.
- Doc 2 has no widget field-level specs — treated Dashboard group labels as the widget list.

**Real Estate CRM Complete User Role Definitions.md**
- Activity domains reflected in nav groups per role — implemented (stubs for later phases).
- Activity Matrix primary work / key metrics — reflected on role dashboards (live where data exists).

---

## Day 7: Sat, Aug 8, 2026; Design tokens, Kanban, tables & 3-second scan

Started aligning the Phase 1 UI with `ui-ux-design-principle-coloring.md` component and color specs.

**What got done**
- Design tokens: listing-status `--status-under-offer` / `--status-reserved` (+ dark remaps) in `index.css` + Tailwind; badge chip padding; `toneForStatus` helper; contacted→primary, qualified→warning.
- Kanban exact spec: column `bg-muted/70`, sticky header + count + aggregate, card shadow/hover, drag rotate/scale, drop dashed primary, avatar + red days-in-stage >14.
- DataTable: sticky uppercase header, h-12 rows, scroll container; new `RowActions` (Call/Email/WhatsApp/Edit) on Leads/Contacts; sheets default `max-w-[450px]`.
- 3-second scan strips on Contact / Lead sheets and Property detail; Owner & mandate behind `<details>` accordion.
- EmptyState entity accents; dimensional Kanban skeletons; Input h-10 + focus border-primary; 44px touch targets on buttons/FAB; MobileFab context actions (call / upload photo).

---

## Day 6: Wed, Aug 6, 2026; Pipeline, dashboards, MapSearch, tests

Landed the final Phase 1 close-out slice (pipeline through DoD).

**What got done**
- Pipeline: Kanban with days-in-stage, deal create/detail sheets (including tasks tab), weighted forecast + lost-reason views.
- Role dashboards differentiated for SA / OW / MG / AG / PM / MK / FN / PU; settings profile/password/MFA; reports hub.
- App routes wired for MFA, SSO callback, sales/leasing pipelines, settings deep links; MapSearch (Leaflet radius) + i18n shell skeleton; Phase 1 npm deps (leaflet, xlsx, vitest, playwright, i18next).
- Tests: Vitest unit suite (`status`, `roles`, `format`, `csv`); Playwright smoke `e2e/lead-loop.spec.ts`; backend `tests/test_phase1_closeout.py`.
- Docs: daily log + role definitions note; gitignore Playwright artifacts.

**Verification**
- `npm run lint`, `npm run build`, `npm test` green; backend close-out tests green when Postgres is up.

---

## Day 5: Tue, Aug 5, 2026; Auth pages + CRM modules + property APIs

Built the main frontend modules and supporting property/deal API fields.

**What got done**
- Auth UI: login SSO button, forgot/reset calling real APIs, MFA page, role-specific onboarding, SSO callback stub; `auth` store with `mfaPending` / `refreshMe`.
- Leads UI: inbox filters (including assignee), capture (RHF+Zod), detail (assign/convert/respond), analytics date range, routing + sources against APIs, merge dialog.
- Contacts UI: list/export (CSV + Excel), 360 sheet, merge, CSV import with dedupe preview; docs tab empty-state for Phase 2.
- Properties UI: grid/table, detail (media cover/reorder, owner/mandate, co-listing), projects tree, advanced search + match-to-lead, listing analytics, amenities + draft/publish on sheet.
- Backend: property geo `lat/lng/radius_km` filter; `Listing.co_listing_agent`; opportunity `days_in_stage`; activity `related_model` for deal tasks.

---

## Day 4: Mon, Aug 4, 2026; foundation shell, auth/leads APIs

Started the Phase 1 close-out with planning docs, design tokens, shell primitives, and thin backend APIs.

**What got done**
- Added `frontend-implimentation-plan.md` and `ui-ux-design-principle-coloring.md`.
- Frontend foundation: blue-600 HSL tokens, status/roles/savedViews/schemas/csv helpers, role-aware AppShell, ScopeBadge, StatCard, DataTable, Cmd+K, global search, FAB, ConfirmDialog, ErrorBoundary/403/404, RequireRole, ActivityTimeline, CustomFieldsEditor, NotificationCenter.
- Backend: forgot/reset password, MFA verify stub, `mfa_enabled` + `lead_routing_strategy` on `/me/`, `Notification` list/mark-read; `LeadSource` CRUD, lead assign action, routing strategy used in `capture_lead` / `route_lead`.

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
- Built role-based access control and row-level scoping within the company (agents see their own records, managers see their branch, owners see company-wide).
- Built the user system with org hierarchy (Company → Branch → Team → User) and JWT auth.
- Built all the domain modules — contacts (with dedup and merge), properties (with listing status tracking), leads (capture → route → score → SLA alerts → convert), deals (pipeline stages with Kanban API), and an activity timeline.
- Scaffolded the React frontend with login, dashboard, and pages for each module.
- Wrote 21 backend tests covering RLS isolation, scoping, dedup, and state machines. All passing.

**Key decisions**
- Access control is role- and ownership-based inside one company (not SaaS multi-company partitioning).
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
