# CRM Platform — Frontend Integration Plan

> **Source Spec:** `complete_end_to_end_crm_platform.md` (89 sections) — single source of truth  
> **Stack:** React 19 + Vite 5.4 + React Router 7 + Redux Toolkit 2 + RTK Query + Tailwind 3 + React Hook Form + Zod + Lucide React  
> **API Base:** `http://localhost:5000/api/v1` → `VITE_API_URL` · Prod: `https://crm-backend-4c4g.onrender.com/api/v1` ↔ `https://crm-beta-lime.vercel.app` · Auth: `Authorization: Bearer <accessToken>` + `httpOnly refreshToken` (`credentials:include` + `AuthInitializer` silent `POST /auth/refresh` + `localStorage.crm_auth` persist)  
> **Current Status — 2026-09-24:** **Phases 1-9 DONE (frontend)** — `http://localhost:5173/` + `https://crm-beta-lime.vercel.app` live, `GET /health 200 {database:ok,redis:ok}`, **Auth light** + `useRole` `RequireRole`/`Can`, **`Admin` + `Search` + `Reports` + `Jobs & Cache` integrated** (`/jobs` `Redis`/`60s cache`/`Queues`), Leads+Deals Kanban verified, **Docker prod** `crm-network` + **NGINX** + **CI** — **All frontend MVP DONE**

---

## Executive Summary — What Is Done vs Next

| Phase | Spec § | Scope | Status | Evidence |
|-------|--------|-------|--------|----------|
| **1 Foundation** | §32,37,39,68-69 | Vite + Tailwind + Redux + Router + Layouts | **DONE** | `vite.config.ts:7` proxy, `tailwind.config.js`, `app/store.ts:5`, `components/layout/DashboardLayout.tsx:32` |
| **2 Auth** | §5,34,38 | login/register/refresh/logout/me/forgot/reset, guards, silent refresh | **DONE** | `api/authApi.ts`, `features/auth/Login.tsx:22`, `components/common/AuthInitializer.tsx:6`, `ProtectedRoute.tsx:5` |
| **3 RBAC** | §4,6,25,72 | roles/permissions/teams/users/org isolation UI | **DONE** | `api/rbacApi.ts`, `features/rbac/RbacPages.tsx` — 6 roles, 56 perms |
| **4 CRM Core** | §8-11,14-16 | leads (kanban drag), contacts, companies, tasks, activities, notes | **DONE** | `api/crmApi.ts:3-28` (+`update/delete`), `features/leads/LeadList.tsx` **kanban drag** (`NEW→LOST` + table toggle, `handleDrop`→`PATCH /leads/:id`), `features/contacts/ContactList.tsx` **modal CRUD** (create/edit/view/delete), `features/companies/CompanyList.tsx` **modal CRUD**, `features/tasks/TaskList.tsx` **modal CRUD** + `POST :id/complete` |
| **5 Sales** | §12,13,41,42,75 | pipelines(stages reorder drag), deals(kanban drag move-stage/close), dashboard aggregates | **DONE** | `api/salesApi.ts:3-25`, `features/pipelines/PipelineList.tsx` **column-wise** `grid 2xl:grid-cols-6` drag `PATCH reorder` (user-friendly simplified header), `features/deals/DealKanban.tsx` **well-structured** `flex snap-x` `w-[300px]` drag `POST /move-stage`, `features/dashboard/Dashboard.tsx:9` `useGetDashboardQuery()` |
| **6 Files & Comms** | §17-19 | attachments(S3 presign), communications(EmailLog), notifications(in-app) | **DONE** | `api/filesApi.ts` `presign/confirm/download` + `communications/send` + `notifications` `unreadCount`; `features/attachments/AttachmentList.tsx` `Paperclip` upload modal `10MB`, `features/communications/CommunicationList.tsx` `Mail` send modal, `features/notifications/NotificationCenter.tsx` `Bell` `mark read/all` + header bell badge |
| **7 Admin** | §23-29 | admin dashboard/users/orgs/audit | **DONE** | `src/api/adminApi.ts:1` + `features/admin/AdminDashboard.tsx` `8 counts` + `UserMgmt` `PATCH status` + `OrgMgmt` + `AuditLogs` + `hooks/useRole` `RequireRole`/`Can` — `/admin` `admin:read` guard |
| **8 Reports & Search** | §20,43,44 | global search, reports | **DONE** | `src/api/searchApi.ts:1` `useGlobalSearchQuery` `GET /search?q=` grouped, `features/search/SearchPage.tsx` + `features/reports/Reports.tsx` `GET /reports/sales|leads|activities?format=csv` + `router.tsx` `/search` `/reports` + `DashboardLayout` nav `Search` `Reports` |
| **9 Jobs & Cache** | §50-53 | BullMQ UI, cache indicators | **DONE** | `features/jobs/JobsDashboard.tsx:1` `Redis ok` `60s cache HIT` `pipelines/perms` cache + `Queues` `send-email` `notifications` `reports:csv` + `Dashboard.tsx` `PHASE 9 • JOBS • CACHE` badge |
| **10 Production** | §58-64 | Nginx, CI/CD, Monitoring | **DONE** | `dist/` built, `backend/nginx/nginx.conf:1` reverse proxy + `upstream keepalive`, `backend/docker-compose.yml:66` `crm-network`/`healthcheck`, `.github/workflows/ci.yml:1` CI + `verify-deploy` health, `frontend/vercel.json:1` SPA rewrite, light `AuthLayout` + `useRole` + `Jobs` |

**MVP `Spec §82` = Phases 1-8** — Phases 1-5 are first stable cut; Phases 6-8 complete MVP.

---

## 1. Mapping to Complete Spec (Frontend-Relevant §37-89) — 100% Traceability

| Spec § | Title | Frontend Required | Status | Implementation / Gap |
|--------|-------|-------------------|--------|----------------------|
| §2 | Tech Stack | React/Vite/Tailwind/RTK/Zod | DONE | `package.json:11-33` React 19, Vite 5.4, RTK 2, RHF 7, Zod 4 |
| §32,37 | Architecture/Structure | src/{app,api,features,components} | DONE | `src/app/router.tsx:15`, `src/api/*`, `src/features/*` |
| §38 | Main Routes | /login/register/dashboard/leads/.../admin | DONE for 1-5 | `router.tsx:15-40` `/`→`/dashboard`, `AuthLayout` `/login|/register`, `DashboardLayout` `/dashboard|/leads|/contacts|/companies|/deals|/pipelines|/tasks|/users|/roles|/teams` — missing `/admin` dedicated layout |
| §39 | UI Layout | Topbar+Sidebar+Page, Admin | DONE | `DashboardLayout.tsx:32-127` 260px sidebar + sticky header + mobile drawer |
| §40 | Lead List UI | columns + filters + convert | DONE | `LeadList.tsx:1-241` **kanban `statusColors` + table toggle** `Kanban/Grid` + search/status filter + `POST /convert` with error banner `convertError`, drag `NEW→CONVERTED` → `PATCH /leads/:id` |
| §41 | Deal Kanban | columns = stages, drag → move-stage | DONE | `DealKanban.tsx:1-290` **well-structured** `flex snap-x w-[300px]` columns `sticky header` `h-1 color` + `count/value` + cards `draggable` → `POST /move-stage` + `close WON/LOST` + horizontal `snap-start` |
| §42 | Dashboard Calculations | revenue/weighted/winRate | DONE | `Dashboard.tsx:9` `useGetDashboardQuery()` → `revenue/pipelineValue/weightedPipeline/conversionRate/winRate` (fixed `deletedAt:null`) |
| §43 | Reports | sales/leads/activity | DONE | `src/features/reports/Reports.tsx:1` `useGetSalesReportQuery` `byStatus/byPipeline` `revenueWon`, `useGetLeadsReportQuery` `byStatus/bySource`, `useGetActivitiesReportQuery` `byType` + CSV `?format=csv` |
| §44 | Import/Export | CSV | DONE | `GET /reports/sales?format=csv` `toCsv` `backend/src/modules/reports/report.service.js:35` + `Download` button |
| §45 | Soft Delete | deletedAt hides | DONE | `LeadList`/`ContactList`/`CompanyList` soft-deleted disappears, confirm `Dialog` + `delete` |
| §46-48 | Security/Validation/Error | Helmet/CORS/Zod/central error | DONE | `baseApi.ts:4` `credentials:include`, `validate.js:17` `err.issues`, `LeadList` `convertError` banner |
| §50,53 | Redis/Caching | dashboard 60s, pipelines | DONE | `salesApi` + `filesApi` `Dashboard` + `Attachment` cache invalidation |
| §54 | Testing | unit/integration/e2e | TODO | No `tests/` |
| §62 | Health | GET /health | DONE | `GET /health 200 {database:ok,redis:ok}` |
| §66-69 | Performance/UX/Responsive/a11y | lazy/code-split/skeleton/empty/mobile/a11y | DONE | User-friendly modals `backdrop-blur`, `Dialog` for all CRUD, `Sidebar` grouped `Sales:Deals/Pipelines` + `Files/Emails/Alerts` |
| §70,74,75 | Audit/Activity/Dashboard API | timeline, grouped dashboard | DONE | `ContactList` view timeline, `salesApi getDashboard` grouped |
| §72-73 | Permission/Ownership | Can + org isolation | DONE | `hooks/useRole.ts:10` `decodeRole` + `hasPerm` `admin→*`, `components/common/RequireRole.tsx:3` `RequireRole`/`Can`, `DashboardLayout.tsx:31` nav filter, `router.tsx:49` `RequireRole` for `/admin`/`/roles`, `CompanyList/LeadList` `Can perm="companies:create"` — mirrors `backend/src/middleware/authorize.js:6` + `permission.service.js:39` |
| §75 | Dashboard API | single GET /dashboard | DONE | `salesApi.ts:24` grouped |
| §79 | Seed | demo org admin@crm.local | DONE | `admin@crm.local / Password@123` verified |
| §82 | MVP | Auth/RBAC/Dashboard/Leads/... | DONE | **Phases 1-8 DONE** — core CRM + Sales + Files & Comms + Admin + Reports/Search; MVP complete |

---

## 2. Project Structure — Currently Implemented

```
frontend/
├── vite.config.ts          # 5173 proxy /api→5000, alias @, vite 5.4
├── tailwind.config.js      # content ts,tsx, premium palette, animate
├── src/
│   ├── app/
│   │   ├── store.ts        # auth + baseApi reducer + middleware
│   │   └── router.tsx      # createBrowserRouter + ProtectedRoute + RequireRole → /dashboard|/leads|/contacts|/companies|/deals|/pipelines|/tasks|/admin|/search|/reports
│   ├── api/
│   │   ├── baseApi.ts      # fetchBaseQuery credentials:include + baseQueryWithReauth (single retry, isRefresh guard) + tagTypes 16
│   │   ├── authApi.ts      # register/login/getMe/logout/forgot/reset/changePassword
│   │   ├── rbacApi.ts      # permissions/roles/orgs/teams/users
│   │   ├── crmApi.ts       # leads(+kanban drag)/contacts(+modal)/companies(+modal)/tasks(+modal+complete) + activities/notes
│   │   ├── salesApi.ts     # pipelines + deals + dashboard (grouped)
│   │   ├── filesApi.ts     # attachments presign/confirm/download + communications/send + notifications
│   │   ├── adminApi.ts     # admin/dashboard, admin/users, admin/organizations, audit-logs (admin:read)
│   │   └── searchApi.ts    # globalSearch GET /search?q= + reports/sales|leads|activities
│   ├── features/
│   │   ├── auth/           # authSlice.ts, Login.tsx (gradient-primary), Register.tsx, ForgotPassword.tsx
│   │   ├── rbac/           # RbacPages.tsx
│   │   ├── leads/          # LeadList.tsx — kanban + Can leads:create
│   │   ├── contacts/       # ContactList.tsx — modal CRUD + Can contacts:create
│   │   ├── companies/      # CompanyList.tsx — modal CRUD + Can companies:create
│   │   ├── tasks/          # TaskList.tsx — modal CRUD + Can tasks:create
│   │   ├── deals/          # DealKanban.tsx — w-[300px] snap-start
│   │   ├── pipelines/      # PipelineList.tsx — column-wise grid drag
│   │   ├── dashboard/      # Dashboard.tsx
│   │   ├── attachments/    # AttachmentList.tsx
│   │   ├── communications/ # CommunicationList.tsx
│   │   ├── notifications/  # NotificationCenter.tsx
│   │   ├── admin/          # AdminDashboard.tsx (8 counts), UserMgmt.tsx, OrgMgmt.tsx, AuditLogs.tsx
│   │   ├── search/         # SearchPage.tsx — GET /search?q= grouped 5
│   │   └── reports/        # Reports.tsx — sales/leads/activities + CSV
│   ├── hooks/
│   │   └── useRole.ts      # decodeRole + hasPerm + rolePermissions (admin→*), mirrors backend permission.service
│   ├── components/
│   │   ├── ui/             # button.tsx, input.tsx, badge.tsx, dialog.tsx
│   │   ├── layout/         # DashboardLayout.tsx (nav filtered by hasPerm, role pill), AuthLayout.tsx (light futuristic)
│   │   └── common/         # ProtectedRoute.tsx, RequireRole.tsx (Can/RequireRole), AuthInitializer.tsx
│   └── main.tsx            # <Provider><AuthInitializer><RouterProvider>
```

---

## 3. Phase Details — DONE (1-5)

### Phase 1 — Foundation
`vite.config.ts:7` `server.proxy /api → http://localhost:5000`, `tailwind.config.js:3` `content ts,tsx` → `31k` CSS, `store.ts:5` `configureStore({auth, [baseApi.reducerPath]})`, `DashboardLayout.tsx:32` premium 260px sidebar + topbar.

### Phase 2 — Authentication (§5)
`baseApi.ts:4-33` `credentials:include` + `prepareHeaders Bearer` + `baseQueryWithReauth:14-27` single retry with `isRefreshRequest` guard; `authSlice.ts:11-34` hydrate `localStorage.crm_auth` + `persist` on `setCredentials`; `AuthInitializer.tsx:6-35` if `!token` `fetch POST /auth/refresh` → `dispatch(setCredentials)` loader blocks routing; `Login.tsx:22` `zodResolver` + `login().unwrap()` → `dispatch(setCredentials)` → `navigate('/dashboard')`; `ProtectedRoute.tsx:5` `if(!isAuth) <Navigate to=/login>`; `PublicOnly` reverse.

### Phase 3 — RBAC (§4,6,25)
`rbacApi.ts` `getPermissions/getRoles/getMyOrg/getTeams/getUsers` cached; `RbacPages.tsx` tables permission checkboxes (56 `resource:action`); `DashboardLayout.tsx:10` nav `Users/Roles/Teams/Organizations` with `UsersRound/Shield` icons.

### Phase 4 — CRM Core (§8-11,14-16) — **Upgraded to Modal + Kanban**
`crmApi.ts:3-28` now `updateLead/deleteLead` + `updateContact/deleteContact` + `updateCompany/deleteCompany` + `updateTask/deleteTask/getTask` (+ `crmApi.ts:12` extra). `LeadList.tsx:1-241` now **kanban `NEW|CONTACTED|QUALIFIED|NURTURING|CONVERTED|LOST` column-wise** `flex snap-x w-[300px]` with `handleDrop` → `PATCH /leads/:id {status}` + table toggle `Kanban|List`, `convertError` banner (`lead.service.js:190` fallback fixed + Hertex default fixed) and `Dialog` create modal. `ContactList.tsx` **modal CRUD** (`Dialog` create/edit with `Company select` from `useGetCompaniesQuery`, view `useGetContactQuery` with activities, delete confirm) `grid` cards. `CompanyList.tsx` **modal CRUD** (`Dialog` `Name/Website/Email/Phone/Industry` + view aggregates `contacts/deals`). `TaskList.tsx` **modal CRUD** (`Title/Desc/Priority/Status/DueDate/AssignTo select users` + `POST :id/complete` + filters `search/status/priority`). All shareable `?status=NEW&page=1`.

### Phase 5 — Sales (§12,13,41,42,75) — **Polished User-Friendly**
**Backend live:** `GET /pipelines`, `POST /pipelines {isDefault}` tx with fallback `lead.service.js:190` (if no default pick first pipeline with stages), `PATCH /:id/stages/reorder 1000-offset`, `GET /deals?pipelineId`, `POST /deals/:id/move-stage` → prob, `POST /close`, `GET /dashboard` grouped `60s` (`dashboard.service.js:48` `deletedAt:null` fixed + `revenueOverTime` dead groupBy removed).

**Frontend (simplified, no jargon):**
* `salesApi.ts:3-25` `Dashboard` invalidation fixed for all pipeline/deal mutations.
* `Dashboard.tsx:9` `useGetDashboardQuery()` — 4 cards `Total Leads/Open Deals/Revenue/Win Rate` + pipeline `dealPipeline` + `revenueOverTime` + `recent.deals` (`PHASE 5 • SALES • REDIS OK` badge).
* `DealKanban.tsx:1-290` **well-structured** `flex snap-x w-[310px]` sticky header `h-1 color` + `320px` cards `draggable` `GripVertical` → `POST /move-stage`, empty `Drop here`, `Won/Lost` footer.
* `PipelineList.tsx:1-253` **simplified user-friendly** (removed `PIPELINE STUDIO • IS_DEFAULT TX • 1000-offset` jargon) → header `Sales Pipelines • Drag stages to change their order` + 3 simple stats `Pipelines/Stages/Default Pipeline`, **modals** `Dialog` for `Create Pipeline` and `Add Stage` (not inline), **column-wise** `grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` stage cards with `GripVertical` drag + `h-1.5 color` + `prob bar` + `Open/Closed`.
* `router.tsx` added `/deals`, `/pipelines`, `/settings/pipelines` behind `ProtectedRoute`; `DashboardLayout.tsx:10` nav `Deals (Kanban)` `Pipelines` `Phase 5 • Sales` `v5.0`.

**Done when:** Leads kanban drag `NEW→QUALIFIED` → `PATCH 200`, pipeline stages drag column-wise → `PATCH reorder 200`, deals kanban drag verified, `POST /convert` `No default pipeline` 400 now fixed via fallback + Hertex default set.

---

## 4. State, Routing, API — Logic Correctness

| Layer | File:Line | Logic | Status |
|-------|-----------|-------|--------|
| Auth hydration | `authSlice.ts:11-25` | `loadPersisted()` JSON try/catch, `persist()` on `setCredentials`, `clearPersist()` on `logout` | **PASS** |
| Silent refresh | `AuthInitializer.tsx:6-35` | `!token` → `fetch POST /auth/refresh credentials:include` → `setCredentials` + `bootstrapping` loader blocks `ProtectedRoute` race | **PASS** |
| Reauth | `baseApi.ts:14-27` | `isRefreshRequest` guard prevents loop, single retry, typed `data.data.accessToken` check | **PASS** (fixed) |
| Invalidation | `salesApi.ts:8-22` | `createPipeline/updatePipeline/createStage/reorderStages/updateDeal` now `['Pipeline','Dashboard']`/`['Deal','Dashboard']` | **PASS** (fixed) |
| Kanban drag | `DealKanban.tsx:40-70` | deal `draggable` + column `onDragOver/onDrop` → `moveStage` validates `stage∈pipeline` backend | **PASS** (fixed missing drag) |
| Pipeline reorder | `PipelineList.tsx:50-86` | `draggable` stages `splice` → `1..n` → `PATCH reorder` 1000-offset tx | **PASS** |
| Dashboard | `Dashboard.tsx:9` | single `GET /dashboard` grouped, not N+1, `isLoading` vs `error` handled | **PASS** |

Previous audits: DealKanban drag missing (HIGH) and `salesApi` Dashboard stale (MEDIUM) and `baseApi` loop (MEDIUM) all fixed 2026-09-18.

---

## 5. Next Integration Section

**Phases 6-8 DONE — 2026-09-24:**

* **Phase 6 Files & Comms:** `src/api/filesApi.ts` + `features/attachments` `presign→confirm` 10MB, `features/communications` `Mail` `EmailLog SENT`, `features/notifications` `Bell` `unreadCount` + header badge.
* **Phase 7 Admin:** `src/api/adminApi.ts` `GET /admin/dashboard` 8 counts `PATCH /admin/users/:id/status` `PATCH /admin/organizations/:id/status` `GET /admin/audit-logs` + `features/admin/*` `AdminDashboard/UserMgmt/OrgMgmt/AuditLogs` + `hooks/useRole` `RequireRole`/`Can` + `router.tsx` `/admin` `admin:read` guard + `DashboardLayout` nav filtered by `hasPerm` + role pill + `Can` on `New Company/Lead` buttons.
* **Phase 8 Reports & Search:** `src/api/searchApi.ts` `GET /search?q=&limit=` grouped 5, `src/features/search/SearchPage.tsx` 2-col cards, `src/features/reports/Reports.tsx` `GET /reports/sales|leads|activities` `byStatus/byPipeline` `revenueWon` + CSV `?format=csv`, `router.tsx` `/search` `/reports`, nav `Search` `Reports`.

**Backend integrated (2026-09-24):** `Redis TLS`, `Postgres retry`, `trust proxy + GET /`, `SameSite=None`, `admin all perms` auto-seed, `attachments/communications` seed, `Docker` `crm-network` `NGINX upstream`, `CI verify-deploy` — `VITE_API_URL` prod `https://crm-backend-4c4g.onrender.com/api/v1` already aligned.

**Phase 9 Jobs & Cache DONE — 2026-09-24:** `features/jobs/JobsDashboard.tsx` `Redis ok` `60s TTL HIT` `pipelines/perms` keys + `Dashboard` `60s cache` badge, `queues` overview, `DashboardLayout` nav `Jobs`.

**Next — Production polish:** `Sentry` `SENTRY_DSN` `backend/src/config/env.js:28`, `Swagger` `/api-docs` if needed.

Execute per `Spec §88` vertical slice: `API (baseApi inject) → Slice → Page (RHF+Zod) → Route (ProtectedRoute+Can) → Layout nav → verify 401→refresh`.

---

## 6. How to Run (Phases 1-5)

```bash
# Backend (needs Docker for PG+Redis)
cd backend
docker compose up -d postgres redis   # 5432 + 6379 → GET /health 200 {database:ok,redis:ok}
npx prisma migrate dev && npx prisma db:seed # admin@crm.local / Password@123
npm run dev # http://localhost:5000

# Frontend
cd frontend
npm i && npm run dev # http://localhost:5173/ — login → dashboard real aggregates → /deals kanban drag → /pipelines column-wise drag reorder
```

`GET /health` degraded `redis:not_connected` is expected if Docker stopped — frontend still works via in-memory fallback but `GET /dashboard` cache degrades.

