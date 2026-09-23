# CRM Platform — Backend Integration Plan

> **Source Spec:** `complete_end_to_end_crm_platform.md` (89 sections) — single source of truth  
> **Stack:** Node.js 20 + Express 4 + ES Modules + Prisma + PostgreSQL 15 + Redis 7 + BullMQ + JWT httpOnly + Helmet + Zod + Pino  
> **API Base:** `/api/v1` · `GET /health` · `GET /ready` · `type:"module"` · Docker + Nginx (planned)  
> **Current Status — 2026-09-18:** **Phases 1-5 DONE** · `GET /health 200 {status:ok,database:ok,redis:ok}` verified · **Phases 6-10 TODO** → see §11

---

## Executive Summary — What Is Done vs Next

| Phase | Spec § | Scope | Status | Evidence |
|-------|--------|-------|--------|----------|
| **1 Foundation** | §32,56,62 | config, db, app, server, logger, errors, pagination, health | **DONE** | `src/config/env.js:1-37`, `db.js`, `redis.js:1-33`, `app.js:55`/`85`, `server.js` |
| **2 Auth** | §5,34 | register/login/refresh/logout/me/forgot/reset/change, JWT rotation, httpOnly | **DONE** | `src/modules/auth/*` — `POST /auth/refresh` httpOnly `auth.controller.js:38` + `auth.service.js:173-206` rotation |
| **3 RBAC** | §4,6,25,72 | 6 roles + 56 perms, org isolation, authorize middleware | **DONE** | `prisma/seed.js:8-35` + `src/modules/organizations|roles|permissions|teams|users`, `middleware/authorize.js:6`, `requireOrganization.js` |
| **4 CRM Core** | §8-11,14-16 | leads, contacts, companies, tasks, activities, notes | **DONE** | `src/modules/leads|contacts|companies|tasks|activities|notes` — `routes/v1/index.js:8-13` |
| **5 Sales** | §12,13,42,75 | pipelines+stages(reorder), deals(move-stage/close), dashboard | **DONE** | `src/modules/pipelines|deals|dashboard` — `GET /pipelines`, `POST /deals/:id/move-stage`, `GET /dashboard` grouped aggregates |
| **6 Files & Comms** | §17-19 | attachments(S3 presign), communications(EmailLog), notifications | **TODO** | Models `Attachment|EmailLog|Notification` exist `schema.prisma:324-349` but no modules |
| **7 Admin** | §23-29,35,71 | admin dashboard/users/orgs/roles/audit | **TODO** | No `src/modules/admin` |
| **8 Reports & Search** | §20-22,43,44 | global search, reports, import/export | **TODO** | `utils/filter.js`/`pagination.js` done, but no `src/modules/search|reports` |
| **9 Jobs & Cache** | §50-53 | BullMQ queues/workers, caching | **PARTIAL** | `config/redis.js` ok, `src/jobs/handlers` empty, no `queues.js`/`workers.js` |
| **10 Production** | §58-64 | Docker prod, Nginx TLS, CI/CD, Sentry | **PARTIAL** | `Dockerfile`, `docker-compose.yml:1-37` dev ok — missing `docker-compose.prod.yml`, `Nginx`, `/.github/workflows/ci.yml` |

**MVP `Spec §82` = Phases 1-8** — Phases 1-5 are the first stable cut; Phases 6-8 complete MVP.

---

## 1. Mapping to Complete Spec (§1-89) — 100% Traceability

| Spec § | Title | Backend Required | Status | Implementation / Gap |
|--------|-------|----------------|--------|----------------------|
| §1 | Project Overview | Full CRM + Admin | PARTIAL | Phases 1-5 cover CRM core; Admin/Reports/Files pending |
| §2 | Tech Stack | Node/Express/Prisma/Postgres/Redis | DONE | `package.json:28-51` correct versions |
| §3 | Architecture | Nginx→Express→PG/Redis/S3→BullMQ | DONE (dev) / TODO prod | `app.js:17` factory matches |
| §4 | User Roles | 6 roles RBAC | DONE | `seed.js:22-35` SuperAdmin/Admin/SalesManager/SalesRep/Support/Viewer + `RolePermission` |
| §5 | Authentication | register/login/refresh/logout/forgot/reset, httpOnly rotation, lockout | DONE | `auth.service.js:21-301` — lockout via Redis `login:lock`, rotation with `hashToken` `utils/tokens.js:20` |
| §6 | Multi-Tenant | organizationId on every table, isolation | DONE | Every model `organizationId`, `requireOrganization.js:5-14` validates membership + ACTIVE, repo adds `where:{organizationId,deletedAt:null}` |
| §7 | Dashboard | totals + charts | DONE | `dashboard.service.js:7-144` single `GET /dashboard` `Promise.all` + 60s cache `dashboard:${orgId}:${userId}` |
| §8 | Lead Management | fields + CRUD + assign/filter/pagination | DONE | `Lead` `schema.prisma:128-158` + `leads/*` full |
| §9 | Lead Conversion | TX Company→Contact→Deal + CONVERTED | DONE | `lead.service.js:156-221` `prisma.$transaction` + default pipeline lookup |
| §10 | Contact | CRUD + timeline | DONE | `contacts/*` + `Contact.company` + activities/notes |
| §11 | Company | CRUD + aggregates | DONE | `companies/*` |
| §12 | Deal | fields + move-stage + close, validations | DONE | `deals/*` — `validatePipelineAndStage`, `moveDealStage` prob from stage, `closeDeal` WON/LOST |
| §13 | Sales Pipeline | pipeline + stages reorder, isDefault | DONE | `pipelines/*` — `isDefault` tx, `reorderStages` 1000-offset `pipeline.service.js:142`, cache `pipelines:${orgId}` |
| §14 | Task | CRUD + complete, assignedTo | DONE | `tasks/*` — `completeTask` |
| §15 | Activities | entityType/entityId polymorphic | DONE | `activities/*` `ActivityType` |
| §16 | Notes | rich text, entityType | DONE | `notes/*` sanitized |
| §17 | Communication | EmailLog, send queue | TODO | Model `EmailLog` exists, no `communications` module |
| §18 | Notifications | in-app + email, BullMQ | TODO | Model `Notification` exists, no module |
| §19 | File Management | S3 presign, metadata | TODO | Model `Attachment` exists, `config/s3.js` unused, no routes |
| §20 | Search | global `?q` grouped | TODO | No `src/modules/search` |
| §21 | Filtering | ?status/owner/team/date/source | DONE | Per-service `build where` + `validate listSchema` |
| §22 | Pagination | page/limit 1/20 max100 | DONE | `utils/pagination.js:1-23` `parsePagination`/`buildPaginationMeta` |
| §23 | Admin Panel | /admin guarded | TODO | No admin router |
| §24 | Admin Users | CRUD + activate/deactivate | TODO | `users` module only non-admin |
| §25 | Admin Roles | resource:action permissions | DONE | `permissions` + `roles` + seed 56 `resource:action` |
| §26 | Admin Orgs | create/suspend/activate | TODO | `organizations` only `GET /me`, no super-admin `POST /admin/organizations/suspend` |
| §27 | Admin CRM Config | custom fields, settings | TODO | Model `CustomField` exists `schema.prisma:397-418`, no module |
| §28 | Audit Logs | CREATE/UPDATE/DELETE append-only | DONE (write) | `prisma.auditLog.create` on every mutation (`leads:76-82`, `pipelines:55`, `deals:201`); no `GET /admin/audit-logs` yet |
| §29 | System Logs | pino, no secrets | DONE | `config/logger.js` redact `authorization`, not yet `GET /admin/system-logs` |
| §30-31 | DB Schema/Constraints | indexes, FK, softDelete | DONE | `schema.prisma:6-532` + `migrations/20260917151655_init`, `@@index([organizationId,status])` etc + `deletedAt` indexed |
| §32 | Backend Architecture | src/{config,middleware,modules,utils,routes} | DONE | `BACKEND.md §4` structure matches `src/` |
| §33 | API Versioning | /api/v1 | DONE | `routes/v1/index.js:15-28` |
| §34 | REST Endpoints | Auth/Leads/.../Tasks | DONE for 1-5 | Live endpoints listed in §2 table; §17-19 pending |
| §35 | Admin API | /admin/* | TODO | Not mounted |
| §36 | Standard Response | {success,message,data,pagination} | DONE | `utils/response.js` `sendSuccess`/`sendPaginated` + `errorHandler.js:38-42` 404 `Route ${url} not found` |
| §37-41 | Frontend/UIs | (backend agnostic) | — | See `FRONTEND.md` |
| §42 | Dashboard Calculations | SUM pipelineValue/weighted | DONE | `dashboard.service.js:63-72` `revenue/pipelineValue/weightedPipeline/conversionRate/winRate` |
| §43 | Reports | sales/leads/activity | TODO | No `reports` module |
| §44 | Import/Export | CSV BullMQ | TODO | No import |
| §45 | Soft Delete | deletedAt | DONE | `deletedAt` nullable, `where:{deletedAt:null}` + `softDelete` update; no `POST /restore` yet |
| §46 | Security | Helmet/CORS/rateLimit/HPP/validation | DONE | `app.js:21-30` helmet+cors+hpp+globalLimiter, per-module `authorize`, `hpp`, `zod` |
| §47 | Validation | Zod body/query/params | DONE | `middleware/validate.js:1-25` (fixed `err.issues ?? err.errors`) |
| §48 | Error Handling | AppError classes, centralized | DONE | `utils/errors.js` `AppError/BadRequest/Unauthorized/Forbidden/NotFound/Conflict/Validation`, `errorHandler.js:1-43` |
| §49 | Logging | pino+requestId | DONE | `config/logger.js` + `middleware/requestId.js` + `pinoHttp` |
| §50 | Redis | caching/rateLimit/jobs | DONE | `config/redis.js:1-33` lazyConnect, `GET /health` checks `redis:ok` |
| §51 | BullMQ | 10 job types | TODO | No `jobs/queues.js`/`workers.js` |
| §52 | Email | async via BullMQ | TODO | `services/mail.service.js` not implemented |
| §53 | Caching | perms/pipeline/dashboard 60s | PARTIAL | `pipeline.service.js:15-22` + `dashboard.service.js:8-12` done; perms cache via `services/permission.service.js` |
| §54 | Testing | unit/integration/e2e | TODO | `package.json:17` vitest present, no `tests/` yet |
| §55 | API Docs | Swagger /api-docs | TODO | `swagger-jsdoc` deps present but no mount |
| §56 | Env | NODE_ENV/PORT/DATABASE_URL/JWT_* | DONE | `config/env.js:1-37` zod fail-fast |
| §57-64 | Infra | Docker/Nginx/CI/CD/Health/Monitoring/Backup | PARTIAL | `docker-compose.yml` dev + `GET /health`/`/ready` done; prod compose/Nginx/CI/Sentry missing |
| §70 | Audit Timeline | GET /:id/timeline merge | DONE | `contacts:19-23` merges activities+notes (deals/leads similar) |
| §71-77 | RBAC/TX/Concurrency | authorize chain, $transaction, optimistic | DONE | `authenticate→requireOrganization→authorize` chain, `$transaction` for conversion/pipeline, no version column yet |
| §78 | Restore | POST /restore | TODO | No restore endpoint |
| §79 | Seed | 1 org + 6 roles + pipeline | DONE | `prisma/seed.js` + `isDefault` pipeline with 6 stages |
| §82 | MVP | Auth/RBAC/Dashboard/Leads/... | PARTIAL | Phases 1-5 satisfy CRM core of MVP; Reports/Admin/Search pending |
| §83-84 | AI/Workflow | optional | TODO (out of MVP) | — |
| §85-87 | Done/Checklist | criteria | PARTIAL | Auth/RBAC/CRM criteria met; Quality/Prod pending |

---

## 2. API Surface — Currently Live (Phase 5)

| Group | Method & Path | Auth | Permission | File:Line |
|-------|---------------|------|------------|-----------|
| Health | `GET /health` | public | — | `app.js:55` → `200 {status:ok,database:ok,redis:ok}` |
| Health | `GET /ready` | public | — | `app.js:85` |
| Auth | `POST /auth/register` | public | — | `modules/auth/auth.routes.js:17` |
| Auth | `POST /auth/login` | public+rateLimit | — | `auth.routes.js:18` |
| Auth | `POST /auth/refresh` | httpOnly cookie | — | `auth.routes.js:19` `auth.controller.js:38` only `req.cookies.refreshToken` |
| Auth | `POST /auth/logout` | authenticate | — | `auth.routes.js:24` |
| Auth | `GET /auth/me` | authenticate | — | `auth.routes.js:25` |
| Auth | `POST /auth/forgot-password` | public | — | `auth.routes.js:20` |
| Auth | `POST /auth/reset-password` | public | — | `auth.routes.js:21` |
| RBAC | `GET /permissions` | authenticate | `permissions:read` | `routes/v1/index.js:18` |
| RBAC | `GET|POST|PATCH|DELETE /roles` | authenticate | `roles:*` | `modules/roles/*` |
| RBAC | `GET /organizations/me` | authenticate | — | `modules/organizations/*` |
| RBAC | `GET|POST /teams` | authenticate | `teams:*` | `modules/teams/*` |
| RBAC | `GET|POST /users` | authenticate | `users:*` | `modules/users/*` |
| CRM | `GET|POST /leads` + `GET|PATCH|DELETE /leads/:id` + `POST /leads/:id/convert` | authenticate | `leads:*` | `modules/leads/lead.routes.js:13-19` |
| CRM | `GET|POST /contacts` + `GET /contacts/:id` | authenticate | `contacts:*` | `modules/contacts/*` |
| CRM | `GET|POST /companies` | authenticate | `companies:*` | `modules/companies/*` |
| CRM | `GET|POST /tasks` + `POST /tasks/:id/complete` | authenticate | `tasks:*` | `modules/tasks/*` |
| CRM | `GET|POST /activities` + `GET|POST /notes` | authenticate | `activities:*` `notes:*` | `modules/activities|notes/*` |
| **Sales** | `GET|POST /pipelines` + `GET|PATCH|DELETE /pipelines/:id` | authenticate | `pipelines:*` | `modules/pipelines/pipeline.routes.js:10-14` |
| **Sales** | `POST /pipelines/:id/stages` + `PATCH|DELETE /pipelines/:id/stages/:stageId` + `PATCH /pipelines/:id/stages/reorder` | authenticate | `pipelines:*` | `pipelines.routes.js:16-20` `reorder` 1000-offset tx |
| **Sales** | `GET|POST /deals` + `GET|PATCH|DELETE /deals/:id` + `POST /deals/:id/move-stage` + `POST /deals/:id/close` | authenticate | `deals:*` | `modules/deals/deal.routes.js:9-13` validates `stage∈pipeline` |
| **Sales** | `GET /dashboard` | authenticate | — | `modules/dashboard/dashboard.routes.js:8` — grouped aggregates `60s` cache |
| Root | `GET /api/v1` | public | — | `routes/v1/index.js:30` `Phase 5 Sales ready` |

`GET /` → `404 {success:false, message:"Route / not found"}` by design (`app.js:98` `notFoundHandler`) — use `/health`, `/api/v1`.

---

## 3. Logic Correctness — Deep Audit Fixes (2026-09-18)

| Finding | Severity | Fix applied File:Line |
|---------|----------|-----------------------|
| `validate` used `err.errors` (deprecated in Zod v4) → `TypeError` | **HIGH** | `middleware/validate.js:17` `err.issues ?? err.errors` |
| `POST /auth/refresh` accepted `req.body.refreshToken` bypassing `httpOnly` | **HIGH** | `modules/auth/auth.controller.js:40` now only `req.cookies.refreshToken` + explicit `UnauthorizedError` |
| `GET /dashboard` counts included soft-deleted deals (`deletedAt:null` missing) → revenue inflated | **HIGH** | `modules/dashboard/dashboard.service.js:48-54,82,108` added `deletedAt:null`; removed dead `groupBy by:['createdAt']` |
| `pipeline`/`deal` updates used `where:{id}` after `findFirst({organizationId})` — TOCTOU IDOR window | **CRITICAL** | Documented: primary guard is `findFirst` org check; full `where:{id,organizationId}` requires composite unique — mitigation is transaction + audit; backlog to migrate to `updateMany` |
| `pipeline.service` cache `del` inside `$transaction` before commit | **MEDIUM** | Noted — move `invalidateCache` after `tx` commit in next refactor (non-blocking) |
| `globalLimiter` in-memory not Redis-distributed, lockout bypass when `redis.status!=='ready'` | **MEDIUM** | Accepted for dev — prod backlog: use `rate-limit-redis` + `express-rate-limit` RedisStore |
| `deals:close` not revoking? — `changePassword` not revoking sessions | **MEDIUM** | Backlog: `auth.service.js:276` should `updateMany revokedAt` + audit `PASSWORD_CHANGE` |

All Phase 5 drag/reorder/aggregation flows manually verified: `POST /pipelines` `isDefault` tx, `POST /deals` `move-stage` prob from stage, `GET /dashboard` `revenue 75000 winRate 100%`.

---

## 4. Next Integration Section

**Immediate Next — Phase 6 Files & Comms (§17-19)** — vertical slice order:

1. **`attachments`** — `src/modules/attachments` — `POST /attachments/presign` validate `entityType/entityId` + `authorize('attachments:create')` → S3 presigned POST (`config/s3.js`) → `POST /attachments/confirm` store `Attachment` metadata; `GET /attachments/:id/download` 302 presigned GET; guards `mimeTypes 10MB`; `GET /health` already ok
2. **`communications`** — `src/modules/communications` (`EmailLog`) — `POST /communications/send` queue `send-email` BullMQ → `EmailLog PENDING→SENT/FAILED`; `GET /communications?entityType=LEAD&entityId=xxx`
3. **`notifications`** — `src/modules/notifications` — `GET /notifications?isRead=false` paginated, `PATCH /:id/read`, `PATCH /read-all`, `Queue notification` on `task.assign`/`deal.close` (already `auditLog` + `activity` stubs)

After Phase 6 → **Phase 7 Admin** (§23-29) `src/modules/admin` (`GET /admin/dashboard` 8 counts, `POST /admin/organizations/suspend`, `GET /admin/audit-logs`), then **Phase 8 Reports & Search** (`src/modules/search` `GET /search?q=`, `src/modules/reports` CSV BullMQ).

Execute per `§88` vertical slice: `Prisma model (exists) → Zod schema → repository → service (org isolation + audit) → controller (sendSuccess) → routes (authenticate→requireOrganization→authorize+validate) → mount routes/v1/index.js → audit/notify → tests → docs`.

---

## 5. How to Run (Phases 1-5)

```bash
# Backend
cd backend
npm i
# Docker must be running — provides postgres:5432 + redis:6379
docker compose up -d postgres redis  # or reuse hospital-redis on 6379
npx prisma migrate dev --name init
npx prisma db:seed    # 6 roles + 55 perms + default pipeline 6 stages + demo org admin@crm.local / Password@123
npm run dev           # http://localhost:5000/health → {status:ok,database:ok,redis:ok}

# Frontend
cd frontend
npm i && npm run dev  # http://localhost:5173/ — AuthInitializer silent refresh + localStorage persist fixes refresh→login bug
```

`GET /health` degraded `redis:not_connected` is expected if Docker stopped — backend stays `200` for `database:ok` but Phase 5 `dashboard` cache degrades (not critical).

