# Railway Backend Deployment Guide — Beginner Friendly (Step by Step)

> For `CRM Backend` — Node.js 22 + Express + Prisma + PostgreSQL + Redis
> Repo: `D:\Customer-Relation-Management\backend`

---

## What You Will Get
```
Your GitHub push
      |
      v
   Railway (auto deploy)
      |
      +--> Node/Express API (public URL like https://crm-backend.up.railway.app)
      |
      +--> PostgreSQL (Railway managed)
      |
      +--> Redis (Railway managed, for BullMQ/cache)
```

**Cost:** Railway gives $5 free trial credit. After that Hobby plan is $5/month. No 6-month free like old AWS. Much simpler than AWS.

---

## Prerequisites
1. GitHub repo with `backend` folder pushed
2. Railway account (use GitHub login): https://railway.app
3. Your backend `.env` NOT committed (only `.env.example` in repo)

---

## STEP 1 - Create Railway Project
1. Go to `https://railway.app` -> `Login with GitHub`
2. Click `New Project`
3. Click `Deploy from GitHub repo` -> Select `Customer-Relation-Management` -> Railway will import repo

## STEP 2 - Add PostgreSQL Database
1. In Railway project canvas, click `+ New` -> `Database` -> `Add PostgreSQL`
2. Wait 30 sec -> Click PostgreSQL service -> Tab `Variables` -> Copy `DATABASE_URL` for reference (Railway auto-injects it). You don't need to create manually, Railway gives it.

## STEP 3 - Add Redis Database
1. Click `+ New` -> `Database` -> `Add Redis`
2. Wait 30 sec -> Click Redis service -> Tab `Variables` -> Copy `REDIS_URL` (looks like `redis://default:xxx@redis.railway.internal:6379`)
3. Note: Your backend uses `REDIS_URL` `backend/src/config/env.js:14` for BullMQ. If you don't need queue now, you can leave default `redis://localhost:6379` but add Redis for full features.

## STEP 4 - Configure Backend Service
1. Click your GitHub service (the backend) -> `Settings` tab
2. Set **Root Directory**: `backend` (IMPORTANT: your repo has `backend/` and `frontend/` at root. Without this Railway will fail)
3. Settings -> `Build Command`: leave default `npm ci` or set `npm ci && npx prisma generate`
4. Settings -> `Start Command`: `npm start` (which runs `node src/server.js` `backend/package.json:9`)
5. Settings -> `Watch Paths`: `backend/**` (so frontend push doesn't redeploy backend)

## STEP 5 - Add Environment Variables (Most Important)
Click backend service -> `Variables` tab -> `+ New Variable` -> Add ONE BY ONE:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_ACCESS_SECRET=paste_64_random_chars_here_min_32_chars
JWT_REFRESH_SECRET=paste_64_random_chars_here_min_32_chars_different_from_access
FRONTEND_URL=https://your-frontend.vercel.app
```

**How to generate secrets (run on your laptop):**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Run twice -> paste one for ACCESS, one for REFRESH.

**Optional if you use S3/SMTP:**
```
S3_BUCKET=xxx
S3_REGION=ap-south-1
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASSWORD=xxx
```

**Do NOT add:**
* `DATABASE_URL` manually typed - use `${{Postgres.DATABASE_URL}}` reference so it auto-updates
* `REDIS_URL` manually - use `${{Redis.REDIS_URL}}`

Click `Add` after each. Railway will auto-redeploy.

## STEP 6 - Fix Prisma for Railway
Railway builds from `backend` folder. Ensure `backend/package.json` has:
```json
"scripts": {
  "start": "node src/server.js",
  "db:deploy": "prisma migrate deploy"
}
```
Railway will run `npm ci` then `npm start`. We need migrate to run automatically.

**Option A (Recommended) - Add to start command:**
In Railway backend service -> `Settings` -> `Start Command` change to:
```
npx prisma migrate deploy && npx prisma generate && node src/server.js
```
Or create `backend/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm ci && npx prisma generate"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && node src/server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

**Option B - Run manually once:**
After first deploy fails, go to backend service -> `Deployments` -> Latest -> `...` -> `Run Command` -> type `npx prisma migrate deploy`

## STEP 7 - Generate Public URL
1. Click backend service -> `Settings` tab -> Scroll to `Networking` -> `Generate Domain`
2. Copy URL like `https://crm-backend-production.up.railway.app`
3. Test: open `https://YOUR_URL/health` -> should show `{"status":"ok"}`
4. Test: `https://YOUR_URL/api/v1/health` (depending on your prefix `backend/src/server.js:26`)

**Update FRONTEND_URL:** Go back to Variables -> edit `FRONTEND_URL` to your real frontend URL (Vercel URL after you deploy frontend). Redeploys automatically.

## STEP 8 - Check Logs
Click backend service -> `Deployments` -> Latest deployment -> `View Logs`
* If you see `🚀 CRM Backend running on http://localhost:5000` `backend/src/server.js:24` -> Success
* If you see `Invalid environment variables` `backend/src/config/env.js:33` -> Missing env var, check STEP 5
* If you see `Can't reach database` -> Check DATABASE_URL reference `${{Postgres.DATABASE_URL}}` is correct
* If you see `Redis not available — continuing without cache` `backend/src/server.js:21` -> OK, app runs degraded without Redis

## STEP 9 - Auto Deploy on GitHub Push
By default Railway auto-deploys on `main` push. No extra CI/CD needed.
1. Push to GitHub: `git push origin main`
2. Railway -> Deployments -> New deployment starts automatically
3. Wait 2-3 mins -> Check logs

## STEP 10 - Custom Domain (Optional)
If you bought domain:
1. Backend service -> `Settings` -> `Networking` -> `Custom Domain` -> Add `api.yourdomain.com`
2. Go to your domain DNS -> Add `CNAME` `api` -> `your-railway-url.up.railway.app`
3. Wait 10 mins -> HTTPS auto enabled.

---

## Checklist
- [ ] Railway project created from GitHub
- [ ] PostgreSQL plugin added
- [ ] Redis plugin added
- [ ] Root Directory = `backend`
- [ ] Variables added (DATABASE_URL, REDIS_URL, JWT secrets, FRONTEND_URL)
- [ ] Start command includes `prisma migrate deploy`
- [ ] Domain generated and `/health` works
- [ ] FRONTEND_URL updated to real frontend URL
- [ ] Auto deploy tested with `git push`

---

## Common Problems

**Build fails `Cannot find module 'prisma'`**
-> Set build command to `npm ci && npx prisma generate`

**Deploy fails `DATABASE_URL is required`**
-> You typed DATABASE_URL manually. Use reference `${{Postgres.DATABASE_URL}}` exactly, with dollar and braces.

**CORS error from frontend**
-> Your backend `FRONTEND_URL` must exactly match frontend URL `https://your-frontend.vercel.app` no trailing slash. Check `backend/src/config/env.js:15`.

**500 error on first request**
-> Check logs `pm2 logs` equivalent is Railway logs. Usually missing `JWT_ACCESS_SECRET` min 32 chars.

**Redis error**
-> If you didn't add Redis service, set `REDIS_URL=redis://localhost:6379` and app will run with warning `backend/src/server.js:21`. For production, add Redis service.

---

## Cost Control
* Railway charges by usage (CPU/RAM). Hobby $5/month covers small PERN app.
* Stop service when not needed: Project -> Service -> `Settings` -> `Destroy` to avoid charges.
* Database backups: Railway PostgreSQL auto-backups daily on paid plan.

---

## Frontend Note
Deploy `frontend` separately on Vercel (free). In Vercel env set:
```
VITE_API_URL=https://YOUR_RAILWAY_BACKEND_URL/api/v1
```

---

## Done
After STEP 7 your API is live at `https://xxx.up.railway.app`. Share that URL with frontend.

If stuck, tell me which STEP number failed and paste log line.
