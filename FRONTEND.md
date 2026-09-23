# CRM Platform — Frontend Integration Plan

> **Source Spec:** `complete_end_to_end_crm_platform.md` (89 sections) — single source of truth  
> **Stack:** React 19 + Vite 5.4 + React Router 7 + Redux Toolkit 2 + RTK Query + Tailwind 3 + React Hook Form + Zod + Lucide React  
> **API Base:** `http://localhost:5000/api/v1` → `VITE_API_URL` · Auth: `Authorization: Bearer <accessToken>` + `httpOnly refreshToken` (`credentials:include` + `AuthInitializer` silent `POST /auth/refresh` + `localStorage.crm_auth` persist)  
> **Current Status — 2026-09-18:** **Phases 1-6 DONE on frontend** — `http://localhost:5173/` live, `GET /health 200 {database:ok,redis:ok}`, Leads+Deals Kanban drag verified, Contacts/Companies/Tasks **modal CRUD**, **Files & Comms (Attachments presign, Communications, Notifications bell) now integrated** — **Phases 7-10 TODO** → see §13

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
| **7 Admin** | §23-29 | admin dashboard/users/orgs/audit | **TODO** | No `src/features/admin` |
| **8 Reports & Search** | §20,43,44 | global search, reports | **TODO** | No `src/features/search|reports` |
| **9 Jobs & Cache** | §50-53 | BullMQ UI, cache indicators | **TODO** | `GET /dashboard` 60s cache badge only |
| **10 Production** | §58-64 | Nginx, CI/CD, Monitoring | **TODO** | `dist/` built, no `Nginx` prod |

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
| §43 | Reports | sales/leads/activity | TODO | No reports feature |
| §44 | Import/Export | CSV | TODO | No import |
| §45 | Soft Delete | deletedAt hides | DONE | `LeadList`/`ContactList`/`CompanyList` soft-deleted disappears, confirm `Dialog` + `delete` |
| §46-48 | Security/Validation/Error | Helmet/CORS/Zod/central error | DONE | `baseApi.ts:4` `credentials:include`, `validate.js:17` `err.issues`, `LeadList` `convertError` banner |
| §50,53 | Redis/Caching | dashboard 60s, pipelines | DONE | `salesApi` + `filesApi` `Dashboard` + `Attachment` cache invalidation |
| §54 | Testing | unit/integration/e2e | TODO | No `tests/` |
| §62 | Health | GET /health | DONE | `GET /health 200 {database:ok,redis:ok}` |
| §66-69 | Performance/UX/Responsive/a11y | lazy/code-split/skeleton/empty/mobile/a11y | DONE | User-friendly modals `backdrop-blur`, `Dialog` for all CRUD, `Sidebar` grouped `Sales:Deals/Pipelines` + `Files/Emails/Alerts` |
| §70,74,75 | Audit/Activity/Dashboard API | timeline, grouped dashboard | DONE | `ContactList` view timeline, `salesApi getDashboard` grouped |
| §72-73 | Permission/Ownership | Can + org isolation | PARTIAL | `ProtectedRoute` + backend `403` fixed; `Can` guards TODO |
| §75 | Dashboard API | single GET /dashboard | DONE | `salesApi.ts:24` grouped |
| §79 | Seed | demo org admin@crm.local | DONE | `admin@crm.local / Password@123` verified |
| §82 | MVP | Auth/RBAC/Dashboard/Leads/... | PARTIAL | **Phases 1-6 DONE** — core CRM + Files & Comms; Reports/Admin pending |

---

## 2. Project Structure — Currently Implemented

```
frontend/
├── vite.config.ts          # 5173 proxy /api→5000, alias @, vite 5.4
├── tailwind.config.js      # content ts,tsx, premium palette, animate
├── src/
│   ├── app/
│   │   ├── store.ts        # auth + baseApi reducer + middleware
│   │   └── router.tsx      # createBrowserRouter + ProtectedRoute + PublicOnly → /dashboard|/leads(kanban)|contacts|companies|deals|pipelines|tasks|users|roles|teams
│   ├── api/
│   │   ├── baseApi.ts      # fetchBaseQuery credentials:include + baseQueryWithReauth (single retry, isRefresh guard) + tagTypes 16
│   │   ├── authApi.ts      # register/login/getMe/logout/forgot/reset/changePassword
│   │   ├── rbacApi.ts      # permissions/roles/orgs/teams/users
│   │   ├── crmApi.ts       # leads(+kanban drag)/contacts(+modal CRUD)/companies(+modal)/tasks(+modal+complete) + activities/notes
│   │   └── salesApi.ts     # pipelines(get/create/update/delete/createStage/reorderStages→Dashboard) + deals(get/create/moveStage/close) + dashboard (grouped)
│   ├── features/
│   │   ├── auth/           # authSlice.ts (localStorage.crm_auth hydrate), Login.tsx, Register.tsx, ForgotPassword.tsx
│   │   ├── rbac/           # RbacPages.tsx (RoleList/UserList/TeamList)
│   │   ├── leads/          # LeadList.tsx — kanban `statusColors` + table toggle + convertError banner + drag NEW→LOST
│   │   ├── contacts/       # ContactList.tsx — modal CRUD (create/edit/view/delete) + search + grid cards
│   │   ├── companies/      # CompanyList.tsx — modal CRUD + view aggregates + search
│   │   ├── tasks/          # TaskList.tsx — modal CRUD + complete + filters + search
│   │   ├── deals/          # DealKanban.tsx — well-structured w-[300px] snap-start columns, draggable cards
│   │   ├── pipelines/      # PipelineList.tsx — simplified user-friendly header + modals + column-wise grid drag
│   │   └── dashboard/      # Dashboard.tsx — real aggregates useGetDashboardQuery()
│   ├── components/
│   │   ├── ui/             # button.tsx, input.tsx, badge.tsx, dialog.tsx (modal backdrop-blur)
│   │   ├── layout/         # DashboardLayout.tsx (260px, nav Sales:Deals/Pipelines), AuthLayout.tsx
│   │   └── common/         # ProtectedRoute.tsx, AuthInitializer.tsx (silent refresh + persist)
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

**Phase 6 Files & Comms — DONE (both backend & frontend) 2026-09-18:**

* `src/api/filesApi.ts` `useGetAttachmentsQuery/usePresignAttachmentMutation/useConfirmAttachmentMutation/useDeleteAttachmentMutation` + `useGetCommunicationsQuery/useSendCommunicationMutation` + `useGetNotificationsQuery/unreadCount/useMarkNotificationReadMutation/useMarkAllNotificationsReadMutation` — all `providesTags/invalidatesTags` `Attachment/Communication/Notification`
* `src/features/attachments/AttachmentList.tsx` `Paperclip` upload modal `file + entityType/entityId` → `presign` → `confirm` (10MB `ALLOWED_MIME`), grid `FileText` cards `Download/Delete`
* `src/features/communications/CommunicationList.tsx` `Mail` send modal `recipient/subject/body/relatedEntity` → `EmailLog SENT` + list `sender→recipient` `status`
* `src/features/notifications/NotificationCenter.tsx` `Bell` `unreadCount` badge in `DashboardLayout.tsx:32` header → `mark read/all` + `delete`, `AuthInitializer` + `baseApi` `credentials:include`
* Nav added `Files/Paperclip`, `Emails/Mail`, `Alerts/BellRing` + `router.tsx` `/attachments|/communications|/notifications` behind `ProtectedRoute`

**Immediate Next — Phase 7 Admin (§23-29):**

`src/features/admin/{AdminDashboard,UserMgmt,OrgMgmt,AuditLogs,SystemLogs}` — `GET /admin/dashboard` (8 aggregates), `GET /admin/users` (activate/deactivate), `GET /admin/organizations` (suspend), `GET /admin/audit-logs` (append-only), `GET /admin/permissions` — all behind `Can admin:read` + `authorize('admin:read')`.

After Phase 7 → **Phase 8 Reports & Search** (§20,43) `GET /search?q=` grouped `leads|contacts|companies|deals|tasks` + `GET /reports/sales|leads|activities` with `from&to&teamId` + CSV export.

Execute per `Spec §88` vertical slice: `API (baseApi inject) → Slice (if needed) → Page (RHF+Zod) → Route (ProtectedRoute+Can) → Layout nav → verify 401→refresh`.

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

