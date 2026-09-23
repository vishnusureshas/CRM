# AWS Free Deployment Guide --- PERN Stack

> **PERN = PostgreSQL + Express.js + React.js + Node.js**
>
> This guide deploys a production-style PERN application on AWS using a
> low-cost/free-tier-oriented architecture:
>
> **React → Nginx → Node/Express → Amazon RDS PostgreSQL**
>
> The goal is to keep the infrastructure simple enough for a developer
> portfolio/project while still using real AWS concepts such as EC2,
> RDS, VPC, Security Groups, Nginx, PM2, environment variables, SSL,
> backups, and deployment automation.

------------------------------------------------------------------------

## 1. Important: What "Free" Means on AWS

AWS Free Tier rules changed for accounts created on or after **July 15,
2025**.

For newer AWS accounts, AWS currently offers a **Free account plan**
with USD \$100 in credits at signup and the possibility of earning up to
another USD \$100 through eligible activities. The Free account plan is
intended for experimenting and proof-of-concept workloads for up to six
months, or until credits are exhausted. Eligible services and limits
vary.

AWS documentation currently lists Free Tier-eligible EC2 instance types
for newer accounts including `t3.micro`, `t3.small`, `t4g.micro`,
`t4g.small`, `c7i-flex.large`, and `m7i-flex.large`, subject to the
account's Free Tier/credit rules.

For RDS PostgreSQL, current AWS Free Tier documentation lists
`db.t3.micro` and `db.t4g.micro` for eligible Free Tier usage.

**Do not assume that every AWS resource is permanently free.** Public
IPv4 addresses, storage, data transfer, snapshots, domains, and usage
above free limits can generate charges.

Before creating resources, check the **Free Tier** label and your AWS
Billing/Free Tier dashboard.

Official references: - https://aws.amazon.com/free/ -
https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html -
https://aws.amazon.com/rds/free/ -
https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/LaunchingAndUsingInstances.html

------------------------------------------------------------------------

# 2. Final Architecture

``` text
                         Internet
                            |
                            v
                  +-------------------+
                  |   EC2 Ubuntu      |
                  |                   |
                  |      Nginx        |
                  |     :80/:443      |
                  |        |           |
                  |   +----+----+      |
                  |   |         |      |
                  | React      API     |
                  | Static    :5000    |
                  | Files       |      |
                  |             v      |
                  |          PM2       |
                  |       Node/Express |
                  +-------------+------+
                                |
                                | PostgreSQL :5432
                                | private network
                                v
                       +-------------------+
                       | Amazon RDS        |
                       | PostgreSQL        |
                       |                  |
                       | db.t3.micro or   |
                       | db.t4g.micro     |
                       +-------------------+
```

## Services

  Component            AWS/Server Service
  -------------------- ----------------------------------
  Frontend             React production build
  Web server           Nginx
  Backend              Node.js + Express
  Process manager      PM2
  Application server   EC2
  Database             Amazon RDS PostgreSQL
  Networking           VPC + Security Groups
  SSL                  Let's Encrypt + Certbot
  Source control       GitHub
  CI/CD                Optional GitHub Actions
  Monitoring           CloudWatch/basic Linux logs
  DNS                  Optional Route 53 / external DNS
  File storage         Optional S3

------------------------------------------------------------------------

# 3. Recommended Free-Friendly Architecture

For learning and portfolio deployment, use:

``` text
1 × EC2
1 × RDS PostgreSQL
1 × Security Group for EC2
1 × Security Group for RDS
Nginx
PM2
Git
Node.js
```

Do **not** start with:

-   ECS/Fargate
-   EKS
-   NAT Gateway
-   Load Balancer
-   Multi-AZ RDS
-   ElastiCache
-   OpenSearch
-   Multiple EC2 instances

Those services can introduce unnecessary costs for a small personal
project.

------------------------------------------------------------------------

# 4. Prerequisites

You should have:

-   AWS account
-   GitHub account
-   PERN project
-   PostgreSQL knowledge
-   Node.js knowledge
-   Git installed
-   SSH knowledge
-   Basic Linux commands

Example project:

``` text
my-pern-app/
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
│
├── server/
│   ├── src/
│   ├── package.json
│   └── .env
│
├── package.json
└── README.md
```

Recommended production separation:

``` text
client = React
server = Express API
database = PostgreSQL
```

------------------------------------------------------------------------

# 5. Prepare the Application Before AWS

## 5.1 Backend

Your Express application should listen on an environment-defined port.

``` js
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

For production, do not hard-code database credentials.

Use:

``` env
PORT=5000
NODE_ENV=production

DB_HOST=your-rds-endpoint
DB_PORT=5432
DB_NAME=pern_db
DB_USER=pern_user
DB_PASSWORD=your-strong-password

JWT_SECRET=your-long-random-secret
CORS_ORIGIN=https://your-domain.com
```

Never commit `.env`.

Add:

``` gitignore
.env
.env.*
!.env.example
node_modules/
dist/
build/
```

Create:

``` text
.env.example
```

Example:

``` env
PORT=5000
NODE_ENV=production

DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=

JWT_SECRET=
CORS_ORIGIN=
```

------------------------------------------------------------------------

# 6. React Production Configuration

If React communicates with the API, use a production API URL.

For Vite:

``` env
VITE_API_URL=https://your-domain.com/api
```

Example:

``` js
const API_URL = import.meta.env.VITE_API_URL;
```

Then:

``` bash
npm install
npm run build
```

This creates:

``` text
dist/
```

For Create React App, the equivalent environment variable normally
starts with:

``` text
REACT_APP_
```

------------------------------------------------------------------------

# 7. Create the AWS Account

Go to the official AWS website:

https://aws.amazon.com/

Choose the appropriate AWS Free Tier/Free account option.

After account creation:

1.  Sign in to AWS Console.
2.  Enable MFA on the root account.
3.  Do not use the root account for everyday development.
4.  Create an IAM administrator/developer identity according to your AWS
    account setup.
5.  Check **Billing → Free Tier**.
6.  Check **Billing → Budgets**.

Create a small budget/alert if available for your account so unexpected
usage is easier to notice.

------------------------------------------------------------------------

# 8. Choose an AWS Region

Choose one region and keep EC2 and RDS in the **same region**.

For example:

``` text
ap-south-1
```

This is the AWS Mumbai region.

You can use another region if your users are elsewhere.

Important:

``` text
EC2 Region = RDS Region
```

Keeping EC2 and RDS in the same region helps avoid unnecessary
cross-region transfer.

------------------------------------------------------------------------

# 9. Create an EC2 Instance

Open:

``` text
AWS Console
→ EC2
→ Instances
→ Launch Instance
```

## Recommended configuration

### Name

``` text
pern-production
```

### Operating System

Use a current Ubuntu LTS AMI that is marked Free Tier eligible for your
account.

Example:

``` text
Ubuntu Server 24.04 LTS
```

### Instance Type

Select an instance type explicitly marked:

``` text
Free tier eligible
```

For many current new accounts, AWS documents:

``` text
t3.micro
t3.small
t4g.micro
t4g.small
```

but eligibility depends on your account and current AWS Free Tier terms.

For a small PERN application:

``` text
t3.micro
```

is a reasonable starting point when it is shown as eligible.

------------------------------------------------------------------------

# 10. Create an EC2 Key Pair

Go to:

``` text
Key pair
→ Create new key pair
```

Example:

``` text
pern-server-key
```

Choose:

``` text
RSA
```

Download:

``` text
pern-server-key.pem
```

Store it securely.

Never upload the `.pem` file to GitHub.

------------------------------------------------------------------------

# 11. Configure EC2 Security Group

Create a security group such as:

``` text
pern-ec2-sg
```

Inbound rules:

  Type      Port Source
  ------- ------ --------------
  SSH         22 Your IP only
  HTTP        80 0.0.0.0/0
  HTTPS      443 0.0.0.0/0

Avoid:

``` text
SSH 22 → 0.0.0.0/0
```

unless you have a specific temporary reason.

Best:

``` text
SSH → My IP
```

------------------------------------------------------------------------

# 12. Connect to EC2

Linux/macOS:

``` bash
chmod 400 pern-server-key.pem
```

Then:

``` bash
ssh -i pern-server-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Windows PowerShell/OpenSSH:

``` bash
ssh -i .\pern-server-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Once connected:

``` bash
uname -a
```

Check Ubuntu:

``` bash
lsb_release -a
```

------------------------------------------------------------------------

# 13. Update Ubuntu

``` bash
sudo apt update
sudo apt upgrade -y
```

Install common tools:

``` bash
sudo apt install -y git curl unzip build-essential
```

------------------------------------------------------------------------

# 14. Install Node.js

Use a current Node.js LTS release compatible with your project.

Example using NodeSource:

``` bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

``` bash
node -v
npm -v
```

Example:

``` text
node v22.x
npm 10.x
```

Do not blindly use an old Node version just because a tutorial does.

------------------------------------------------------------------------

# 15. Install Nginx

``` bash
sudo apt install -y nginx
```

Check:

``` bash
sudo systemctl status nginx
```

Enable on boot:

``` bash
sudo systemctl enable nginx
```

Open:

``` text
http://YOUR_EC2_PUBLIC_IP
```

You should see the Nginx welcome page.

------------------------------------------------------------------------

# 16. Install PM2

``` bash
sudo npm install -g pm2
```

Verify:

``` bash
pm2 -v
```

PM2 will keep the Node.js API running.

------------------------------------------------------------------------

# 17. Create Application Directory

``` bash
sudo mkdir -p /var/www/pern-app
sudo chown -R $USER:$USER /var/www/pern-app
```

Move into it:

``` bash
cd /var/www/pern-app
```

------------------------------------------------------------------------

# 18. Clone Your GitHub Repository

Example:

``` bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git .
```

Check:

``` bash
ls
```

Expected:

``` text
client
server
package.json
README.md
```

If your repository is private, use a secure GitHub authentication method
such as SSH keys or a GitHub token. Never put credentials directly in
the repository URL.

------------------------------------------------------------------------

# 19. Install Backend Dependencies

``` bash
cd /var/www/pern-app/server
npm ci
```

If you don't have a lock file:

``` bash
npm install
```

------------------------------------------------------------------------

# 20. Configure Production Environment Variables

Create:

``` bash
nano .env
```

Example:

``` env
NODE_ENV=production
PORT=5000

DB_HOST=your-rds-endpoint
DB_PORT=5432
DB_NAME=pern_db
DB_USER=pern_user
DB_PASSWORD=your-strong-password

JWT_SECRET=replace-with-a-long-random-secret

CORS_ORIGIN=https://your-domain.com
```

Save the file.

Protect it:

``` bash
chmod 600 .env
```

------------------------------------------------------------------------

# 21. Create PostgreSQL Database with Amazon RDS

Open:

``` text
AWS Console
→ RDS
→ Databases
→ Create database
```

Choose:

``` text
PostgreSQL
```

For a Free Tier account, select the option that AWS currently marks as
Free Tier eligible.

AWS currently documents:

``` text
db.t3.micro
db.t4g.micro
```

for Free Tier RDS PostgreSQL usage, subject to the current Free Tier
rules.

------------------------------------------------------------------------

# 22. RDS Basic Configuration

Example:

``` text
DB identifier:
pern-postgres
```

Master username:

``` text
pern_user
```

Password:

``` text
Use a strong unique password
```

Database name:

``` text
pern_db
```

Availability:

``` text
Single-AZ
```

For a learning/portfolio deployment, do not enable expensive
high-availability features unless required.

------------------------------------------------------------------------

# 23. RDS Storage

Use the smallest Free Tier-eligible storage configuration offered by the
console.

Do not unnecessarily increase:

``` text
Storage
IOPS
Provisioned throughput
Backup retention
```

Storage and backup usage can create charges when outside the applicable
Free Tier limits.

------------------------------------------------------------------------

# 24. RDS Security Group

Create:

``` text
pern-rds-sg
```

Inbound:

``` text
PostgreSQL
Port: 5432
Source: pern-ec2-sg
```

Do NOT use:

``` text
5432 → 0.0.0.0/0
```

The database should accept PostgreSQL traffic from your EC2 security
group rather than the whole internet.

------------------------------------------------------------------------

# 25. RDS Public Access

For the recommended architecture:

``` text
Public access = No
```

The architecture should be:

``` text
Internet
   |
   v
EC2
   |
   v
RDS
```

Not:

``` text
Internet
   |
   v
RDS
```

------------------------------------------------------------------------

# 26. Get the RDS Endpoint

After RDS becomes available:

``` text
RDS
→ Databases
→ pern-postgres
→ Connectivity & security
```

Copy the endpoint.

Example:

``` text
pern-postgres.xxxxxxxxxxxx.ap-south-1.rds.amazonaws.com
```

Use it in:

``` env
DB_HOST=pern-postgres.xxxxxxxxxxxx.ap-south-1.rds.amazonaws.com
```

Do not use the EC2 IP as the database host.

------------------------------------------------------------------------

# 27. Test RDS Connectivity From EC2

Install PostgreSQL client:

``` bash
sudo apt install -y postgresql-client
```

Test:

``` bash
psql \
  -h YOUR_RDS_ENDPOINT \
  -U pern_user \
  -d pern_db \
  -p 5432
```

Enter your password.

If successful:

``` text
pern_db=>
```

You are connected.

------------------------------------------------------------------------

# 28. Common RDS Connection Problems

## Problem: Connection timed out

Check:

``` text
EC2 Security Group
RDS Security Group
Port 5432
VPC
Subnet
```

RDS inbound rule should allow:

``` text
PostgreSQL 5432
Source = pern-ec2-sg
```

## Problem: Password authentication failed

Check:

``` text
DB_USER
DB_PASSWORD
```

## Problem: Database does not exist

Check:

``` text
DB_NAME
```

## Problem: Host not found

Check the RDS endpoint.

------------------------------------------------------------------------

# 29. Run Database Migrations

If using Prisma:

``` bash
npx prisma migrate deploy
```

If using Knex:

``` bash
npx knex migrate:latest
```

If using Sequelize:

``` bash
npx sequelize-cli db:migrate
```

If you use SQL migration files, execute them using `psql`.

------------------------------------------------------------------------

# 30. Seed the Database

Example:

``` bash
npm run seed
```

Or:

``` bash
node src/seed.js
```

Use a dedicated production-safe seed script.

Do not insert development passwords or test secrets into production.

------------------------------------------------------------------------

# 31. Test Express API

Start temporarily:

``` bash
npm start
```

or:

``` bash
node src/server.js
```

From EC2:

``` bash
curl http://localhost:5000
```

If your health route exists:

``` bash
curl http://localhost:5000/api/health
```

Expected:

``` json
{
  "status": "ok"
}
```

Stop the temporary server with:

``` text
CTRL + C
```

------------------------------------------------------------------------

# 32. Start Express With PM2

Example:

``` bash
cd /var/www/pern-app/server
pm2 start src/server.js --name pern-api
```

If your entry file is:

``` text
server.js
```

use:

``` bash
pm2 start server.js --name pern-api
```

Check:

``` bash
pm2 status
```

Logs:

``` bash
pm2 logs pern-api
```

Restart:

``` bash
pm2 restart pern-api
```

------------------------------------------------------------------------

# 33. PM2 Ecosystem Configuration

A better production setup is:

``` bash
nano ecosystem.config.js
```

Example:

``` js
module.exports = {
  apps: [
    {
      name: "pern-api",
      script: "./src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
```

Start:

``` bash
pm2 start ecosystem.config.js
```

Save:

``` bash
pm2 save
```

Generate startup configuration:

``` bash
pm2 startup
```

PM2 will print a command.

Run that command exactly as shown.

Then:

``` bash
pm2 save
```

------------------------------------------------------------------------

# 34. Build React Frontend

Open a new shell or continue on EC2:

``` bash
cd /var/www/pern-app/client
npm ci
```

Create production environment:

``` bash
nano .env.production
```

Example:

``` env
VITE_API_URL=https://your-domain.com/api
```

Build:

``` bash
npm run build
```

You should get:

``` text
dist/
```

For Create React App, you may get:

``` text
build/
```

------------------------------------------------------------------------

# 35. Configure Nginx

Create:

``` bash
sudo nano /etc/nginx/sites-available/pern-app
```

For a Vite React application:

``` nginx
server {
    listen 80;
    listen [::]:80;

    server_name YOUR_DOMAIN_OR_EC2_IP;

    root /var/www/pern-app/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If your frontend build directory is `build`, replace:

``` text
client/dist
```

with:

``` text
client/build
```

------------------------------------------------------------------------

# 36. Enable Nginx Configuration

Remove default configuration if necessary:

``` bash
sudo rm -f /etc/nginx/sites-enabled/default
```

Create symbolic link:

``` bash
sudo ln -s /etc/nginx/sites-available/pern-app \
  /etc/nginx/sites-enabled/pern-app
```

Test:

``` bash
sudo nginx -t
```

If successful:

``` text
syntax is ok
test is successful
```

Restart:

``` bash
sudo systemctl restart nginx
```

------------------------------------------------------------------------

# 37. Test Full Application

Open:

``` text
http://YOUR_EC2_PUBLIC_IP
```

Flow:

``` text
Browser
   ↓
Nginx :80
   ↓
React static files
```

API:

``` text
Browser
   ↓
/api/*
   ↓
Nginx
   ↓
127.0.0.1:5000
   ↓
Express
   ↓
RDS PostgreSQL
```

------------------------------------------------------------------------

# 38. React Router Fix

If using:

``` text
react-router-dom
```

this Nginx configuration is important:

``` nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Without it, direct navigation to:

``` text
/dashboard
/profile
/users/123
```

can return:

``` text
404 Not Found
```

------------------------------------------------------------------------

# 39. CORS Configuration

Your Express backend should allow the production frontend.

Example:

``` js
import cors from "cors";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  })
);
```

Production:

``` env
CORS_ORIGIN=https://your-domain.com
```

Do not permanently use:

``` js
origin: "*"
```

for an authenticated production application.

------------------------------------------------------------------------

# 40. Cookies and HTTPS

If your authentication uses cookies:

``` js
cookie: {
  httpOnly: true,
  secure: true,
  sameSite: "lax"
}
```

`secure: true` requires HTTPS.

Therefore, for production authentication, configure HTTPS before relying
on secure cookies.

------------------------------------------------------------------------

# 41. Domain Name

You have two choices.

## Option A --- No domain

Use:

``` text
http://YOUR_EC2_PUBLIC_IP
```

This avoids buying a domain.

Important:

The public IP can change when the EC2 instance is stopped/started
depending on the configuration.

## Option B --- Custom domain

Example:

``` text
example.com
```

Then:

``` text
api.example.com
```

or:

``` text
example.com/api
```

A custom domain is not automatically free. Domain registration normally
costs money.

------------------------------------------------------------------------

# 42. DNS

If you own a domain, create an A record:

``` text
Type: A
Name: @
Value: EC2_PUBLIC_IP
```

For a subdomain:

``` text
Type: A
Name: api
Value: EC2_PUBLIC_IP
```

DNS propagation can take time.

------------------------------------------------------------------------

# 43. HTTPS With Let's Encrypt

HTTPS certificates from Let's Encrypt are free.

Install Certbot:

``` bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

Run:

``` bash
sudo certbot --nginx -d your-domain.com
```

If using `www`:

``` bash
sudo certbot --nginx \
  -d your-domain.com \
  -d www.your-domain.com
```

Certbot can configure Nginx automatically.

Test renewal:

``` bash
sudo certbot renew --dry-run
```

Important:

You need a domain name pointing to the EC2 server. A normal EC2 IP
address is not a replacement for a domain-based Let's Encrypt
certificate.

------------------------------------------------------------------------

# 44. Production Nginx HTTPS Structure

After Certbot:

``` text
Internet
   |
 HTTPS :443
   |
 Nginx
   |
   +---- React
   |
   +---- /api → localhost:5000
```

------------------------------------------------------------------------

# 45. Environment Variables --- Production Rules

Never put these in Git:

``` text
DB_PASSWORD
JWT_SECRET
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
PRIVATE_KEYS
API_KEYS
```

Use:

``` text
.env
```

and:

``` gitignore
.env
```

For larger production systems, consider:

``` text
AWS Secrets Manager
AWS Systems Manager Parameter Store
```

These may introduce cost depending on usage, so they are not necessary
for a simple free/portfolio deployment.

------------------------------------------------------------------------

# 46. Database Connection Pool

For PostgreSQL, use a connection pool.

Example with `pg`:

``` js
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

export default pool;
```

For a small Free Tier instance, do not create an unnecessarily large
connection pool.

------------------------------------------------------------------------

# 47. Health Check Endpoint

Create:

``` text
GET /api/health
```

Example response:

``` json
{
  "status": "ok",
  "service": "pern-api"
}
```

Test:

``` bash
curl https://your-domain.com/api/health
```

------------------------------------------------------------------------

# 48. Useful Linux Commands

Check disk:

``` bash
df -h
```

Check memory:

``` bash
free -h
```

Check CPU:

``` bash
top
```

Check processes:

``` bash
ps aux
```

Check listening ports:

``` bash
sudo ss -tulpn
```

Check Nginx:

``` bash
sudo systemctl status nginx
```

Check Nginx errors:

``` bash
sudo tail -f /var/log/nginx/error.log
```

Check Nginx access:

``` bash
sudo tail -f /var/log/nginx/access.log
```

Check PM2:

``` bash
pm2 status
```

PM2 logs:

``` bash
pm2 logs
```

------------------------------------------------------------------------

# 49. Deployment Update Process

When you push new code:

``` bash
cd /var/www/pern-app
git pull origin main
```

Backend:

``` bash
cd server
npm ci
```

Run migrations if needed:

``` bash
npx prisma migrate deploy
```

or your project's migration command.

Restart:

``` bash
pm2 restart pern-api
```

Frontend:

``` bash
cd ../client
npm ci
npm run build
```

Reload Nginx if configuration changed:

``` bash
sudo nginx -t
sudo systemctl reload nginx
```

------------------------------------------------------------------------

# 50. Create a Deployment Script

Create:

``` bash
nano /var/www/pern-app/deploy.sh
```

Example:

``` bash
#!/bin/bash

set -e

APP_DIR="/var/www/pern-app"

echo "Starting deployment..."

cd "$APP_DIR"

git pull origin main

echo "Installing backend dependencies..."
cd server
npm ci

echo "Running database migrations..."
# Replace with your actual migration command
# npx prisma migrate deploy

echo "Restarting backend..."
pm2 restart pern-api

echo "Building frontend..."
cd ../client
npm ci
npm run build

echo "Testing Nginx..."
sudo nginx -t

echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "Deployment completed."
```

Make executable:

``` bash
chmod +x deploy.sh
```

Run:

``` bash
./deploy.sh
```

------------------------------------------------------------------------

# 51. GitHub Actions CI/CD

Once the manual deployment is working, add CI/CD so every push to `main`
can automatically test and deploy the application.

The recommended flow is:

```text
Developer
   |
   | git push origin main
   v
GitHub
   |
   v
GitHub Actions
   |
   +----------------------+
   |                      |
   v                      v
Install/Test/Build     Deployment
   |                      |
   +----------+-----------+
              |
              v
          SSH to EC2
              |
              v
        /var/www/pern-app
              |
              +-- git pull
              +-- npm ci
              +-- database migration
              +-- backend restart
              +-- frontend build
              +-- Nginx reload
              +-- health check
```

CI/CD means:

```text
CI = Continuous Integration
CD = Continuous Deployment
```

For this architecture, GitHub Actions is the CI/CD platform and EC2 is the
deployment server.

Important: make the manual deployment work first. CI/CD should automate a
known-good deployment rather than being used to debug the initial server.

---

# 52. Prepare the EC2 Server for CI/CD

The EC2 server should already contain:

```text
Git
Node.js
Nginx
PM2
PERN application
production .env
deploy.sh
```

The application directory remains:

```bash
/var/www/pern-app
```

Make sure the deployment script is executable:

```bash
chmod +x /var/www/pern-app/deploy.sh
```

Test it manually:

```bash
cd /var/www/pern-app
./deploy.sh
```

Do not continue to GitHub Actions until this command completes successfully.

---

# 53. Create a Production Deployment Script

Use a deployment script so GitHub Actions only needs to trigger one command.

Create:

```bash
nano /var/www/pern-app/deploy.sh
```

Example:

```bash
#!/bin/bash

set -e

APP_DIR="/var/www/pern-app"

echo "================================="
echo "Starting PERN deployment"
echo "================================="

cd "$APP_DIR"

echo "Pulling latest code..."
git fetch origin
git reset --hard origin/main

echo "Installing backend dependencies..."
cd "$APP_DIR/server"
npm ci

echo "Running database migrations..."

# Use the migration command used by your project.
# Prisma example:
# npx prisma migrate deploy

# Knex example:
# npx knex migrate:latest

echo "Restarting backend..."
pm2 restart pern-api || pm2 start ecosystem.config.js

echo "Installing frontend dependencies..."
cd "$APP_DIR/client"
npm ci

echo "Building React frontend..."
npm run build

echo "Testing Nginx configuration..."
sudo nginx -t

echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "Checking API..."
curl --fail --silent http://127.0.0.1:5000/api/health > /dev/null

echo "================================="
echo "Deployment completed successfully"
echo "================================="
```

Make executable:

```bash
chmod +x /var/www/pern-app/deploy.sh
```

Test:

```bash
cd /var/www/pern-app
./deploy.sh
```

The `set -e` instruction makes the script stop when a command fails. This
prevents the pipeline from continuing after a critical deployment error.

---

# 54. GitHub Actions CI Pipeline

Before deployment, run automated checks.

A basic CI pipeline can perform:

```text
Checkout
   ↓
Install dependencies
   ↓
Lint
   ↓
Tests
   ↓
Frontend build
   ↓
Backend checks
```

Create:

```text
.github/workflows/ci.yml
```

Example:

```yaml
name: PERN CI

on:
  pull_request:
    branches:
      - main

  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: |
            package-lock.json
            client/package-lock.json
            server/package-lock.json

      - name: Install root dependencies
        run: npm ci
        continue-on-error: true

      - name: Install backend dependencies
        working-directory: server
        run: npm ci

      - name: Install frontend dependencies
        working-directory: client
        run: npm ci

      - name: Backend lint
        working-directory: server
        run: npm run lint
        continue-on-error: true

      - name: Backend tests
        working-directory: server
        run: npm test
        continue-on-error: true

      - name: Frontend lint
        working-directory: client
        run: npm run lint
        continue-on-error: true

      - name: Frontend build
        working-directory: client
        run: npm run build
```

If your project does not contain a particular script, such as `lint` or
`test`, either add it to `package.json` or remove that step. Do not silently
ignore real test failures in a mature production pipeline.

For strict CI, remove `continue-on-error: true` from checks that must block
deployment.

---

# 55. GitHub Actions CD Pipeline

After CI succeeds, deploy to EC2.

The desired pipeline is:

```text
Push to main
     ↓
CI
     ↓
Lint
     ↓
Tests
     ↓
Build
     ↓
CI successful
     ↓
Deploy job
     ↓
SSH to EC2
     ↓
deploy.sh
     ↓
Health check
```

Create:

```text
.github/workflows/deploy.yml
```

Example:

```yaml
name: Deploy PERN Application

on:
  push:
    branches:
      - main

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: |
            client/package-lock.json
            server/package-lock.json

      - name: Install backend dependencies
        working-directory: server
        run: npm ci

      - name: Install frontend dependencies
        working-directory: client
        run: npm ci

      - name: Backend lint
        working-directory: server
        run: npm run lint

      - name: Backend tests
        working-directory: server
        run: npm test

      - name: Frontend lint
        working-directory: client
        run: npm run lint

      - name: Frontend build
        working-directory: client
        run: npm run build

  deploy:
    needs: ci
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /var/www/pern-app
            ./deploy.sh
```

The important part is:

```yaml
deploy:
  needs: ci
```

This means deployment starts only after the CI job succeeds.

---

# 56. Configure GitHub Repository Secrets

Never put the EC2 private SSH key directly inside:

```text
.github/workflows/deploy.yml
```

Instead create GitHub repository secrets.

Go to:

```text
GitHub Repository
→ Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

Create:

```text
EC2_HOST
EC2_USER
EC2_SSH_KEY
```

Example values:

```text
EC2_HOST
YOUR_EC2_PUBLIC_IP
```

```text
EC2_USER
ubuntu
```

For:

```text
EC2_SSH_KEY
```

paste the complete private key content:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

Never commit this key to GitHub.

---

# 57. GitHub Actions Deployment Authentication

The architecture is:

```text
GitHub Actions Runner
        |
        | SSH
        v
      EC2
        |
        v
/var/www/pern-app
```

The GitHub runner uses:

```text
EC2_HOST
EC2_USER
EC2_SSH_KEY
```

to establish the SSH connection.

The deployment script then runs on EC2.

This keeps production credentials out of the workflow file.

---

# 58. Important Git Configuration on EC2

Because the deployment script runs:

```bash
git fetch origin
git reset --hard origin/main
```

the EC2 server must be able to authenticate to the GitHub repository.

For a public repository, HTTPS can be sufficient:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git .
```

For a private repository, configure a secure GitHub authentication method,
such as a deploy key or GitHub App/token-based authentication.

Do not put a GitHub token directly into:

```text
deploy.sh
```

or the workflow YAML.

Test on EC2:

```bash
cd /var/www/pern-app
git fetch origin
```

It should succeed without asking for credentials interactively.

---

# 59. Production Environment Variables With CI/CD

CI/CD should not overwrite your production `.env` accidentally.

Keep:

```text
/var/www/pern-app/server/.env
```

only on EC2.

Example:

```env
NODE_ENV=production
PORT=5000

DB_HOST=your-rds-endpoint
DB_PORT=5432
DB_NAME=pern_db
DB_USER=pern_user
DB_PASSWORD=your-strong-password

JWT_SECRET=your-long-random-secret
CORS_ORIGIN=https://your-domain.com
```

The GitHub repository should contain:

```text
.env.example
```

but not:

```text
.env
```

Add:

```gitignore
.env
.env.*
!.env.example
```

Important:

```text
GitHub Actions secrets
        ≠
Application .env
```

They serve different purposes.

---

# 60. Frontend Environment Variables in CI/CD

React production variables such as:

```env
VITE_API_URL=https://your-domain.com/api
```

are bundled into the frontend during:

```bash
npm run build
```

Therefore they are not secret.

Never put:

```text
DB_PASSWORD
JWT_SECRET
AWS_SECRET_ACCESS_KEY
```

into:

```text
VITE_*
REACT_APP_*
```

because frontend variables can be inspected by users.

---

# 61. Database Migrations in CI/CD

Database migrations should be version-controlled.

Recommended:

```text
Developer
   ↓
Create migration
   ↓
Git commit
   ↓
Push
   ↓
CI tests
   ↓
Deploy
   ↓
Production migration
   ↓
Application restart
```

For Prisma:

```bash
npx prisma migrate deploy
```

For Knex:

```bash
npx knex migrate:latest
```

For Sequelize:

```bash
npx sequelize-cli db:migrate
```

Add the correct command to:

```text
deploy.sh
```

Do not run development migration commands against production.

For example, Prisma production deployment should use:

```bash
npx prisma migrate deploy
```

rather than creating new migrations on the production server.

---

# 62. Health Check After Deployment

A deployment should verify that the application is actually running.

Create:

```text
GET /api/health
```

Example:

```json
{
  "status": "ok",
  "service": "pern-api"
}
```

Test locally on EC2:

```bash
curl --fail http://127.0.0.1:5000/api/health
```

Test through Nginx:

```bash
curl --fail https://your-domain.com/api/health
```

If the health check fails, GitHub Actions should report the deployment as
failed.

---

# 63. Safer Deployment Order

For this single-EC2 architecture, use:

```text
1. Pull latest code
        ↓
2. Install backend dependencies
        ↓
3. Run database migrations
        ↓
4. Restart backend
        ↓
5. Install frontend dependencies
        ↓
6. Build frontend
        ↓
7. Test Nginx
        ↓
8. Reload Nginx
        ↓
9. Health check
```

For applications requiring zero-downtime deployment, use a more advanced
architecture such as multiple application instances, a load balancer,
containers, or blue/green deployment.

The single-EC2 workflow is intended to remain simple and cost-conscious.

---

# 64. GitHub Actions Workflow Files

A clean repository can contain:

```text
.github/
└── workflows/
    ├── ci.yml
    └── deploy.yml
```

Meaning:

```text
ci.yml
  ↓
Testing and build

deploy.yml
  ↓
Production deployment
```

You can also combine CI and CD into one workflow for a small project.

For a portfolio application, either structure is acceptable as long as the
deployment job is blocked when required checks fail.

---

# 65. Complete CI/CD Flow

After configuration:

```text
Developer
   |
   | git add .
   | git commit
   | git push origin main
   v
GitHub
   |
   v
GitHub Actions
   |
   +-----------------------+
   |                       |
   v                       v
Checkout              Setup Node.js
   |                       |
   +-----------+-----------+
               |
               v
        npm ci
               |
               v
             Lint
               |
               v
             Tests
               |
               v
        React Production Build
               |
               v
          CI Successful
               |
               v
         Deploy to EC2
               |
               v
          SSH Connection
               |
               v
       /var/www/pern-app
               |
               v
          ./deploy.sh
               |
       +-------+-------+
       |               |
       v               v
    Backend         Frontend
    npm ci          npm ci
       |               |
    Migrations       Build
       |               |
    PM2 restart        |
       +-------+-------+
               |
               v
         Nginx reload
               |
               v
         Health check
               |
               v
       Deployment complete
```

---

# 66. CI/CD Failure Troubleshooting

## GitHub Actions cannot SSH to EC2

Check:

```text
EC2_HOST
EC2_USER
EC2_SSH_KEY
```

Also check the EC2 Security Group:

```text
SSH 22 → GitHub Actions runner access
```

A key consideration is that GitHub-hosted runner IP addresses are not fixed
to one small address range suitable for a simple static Security Group rule.
For a basic setup, keep SSH authentication strong and consider a more
controlled deployment architecture if strict source-IP restriction is
required.

---

## Permission denied

Check:

```bash
ls -la /var/www/pern-app
```

Check ownership:

```bash
sudo chown -R ubuntu:ubuntu /var/www/pern-app
```

Only change ownership where appropriate for your server setup.

---

## Git pull/fetch fails

On EC2:

```bash
cd /var/www/pern-app
git fetch origin
```

For a private repository, verify the repository authentication method.

---

## npm ci fails

Check:

```bash
node -v
npm -v
```

Ensure the lock file matches the project's package configuration.

---

## PM2 fails

Check:

```bash
pm2 status
pm2 logs pern-api
```

Also check:

```bash
cd /var/www/pern-app/server
node src/server.js
```

to identify application-level errors.

---

## Nginx fails

Test:

```bash
sudo nginx -t
```

Then:

```bash
sudo tail -f /var/log/nginx/error.log
```

---

## Health check fails

Check:

```bash
pm2 status
pm2 logs pern-api
```

Then:

```bash
curl http://127.0.0.1:5000/api/health
```

If localhost works but the public URL fails, inspect Nginx and HTTPS
configuration.

---

# 67. CI/CD Security Checklist

```text
[ ] GitHub repository does not contain production .env
[ ] GitHub repository does not contain private SSH keys
[ ] GitHub Actions secrets are used for deployment credentials
[ ] EC2 SSH authentication uses a private key
[ ] RDS is not publicly accessible
[ ] Port 5432 is not open to the internet
[ ] Port 5000 is not open to the internet
[ ] Production secrets remain on the server
[ ] GitHub repository access is controlled
[ ] Database migrations are version-controlled
[ ] CI checks run before deployment
[ ] Health check runs after deployment
[ ] Deployment failures are visible in GitHub Actions
```

---

# 68. Recommended CI/CD Improvement: Separate Build and Deploy

A more structured pipeline is:

```text
CI
 |
 +-- Backend install
 +-- Backend lint
 +-- Backend tests
 +-- Frontend install
 +-- Frontend lint
 +-- Frontend tests
 +-- Frontend build
 |
 v
Artifact / successful CI
 |
 v
CD
 |
 +-- SSH to EC2
 +-- Deploy
 +-- Migration
 +-- PM2 restart
 +-- Nginx reload
 +-- Health check
```

This separation makes failures easier to identify:

```text
CI failure
→ code/test/build problem

CD failure
→ server/deployment/infrastructure problem
```

---

# 69. CI/CD Branch Strategy

For a simple portfolio project:

```text
main
 ↓
Production
```

For a larger project:

```text
feature/*
    ↓
develop
    ↓
main
    ↓
Production
```

Example:

```bash
git checkout -b feature/user-profile
```

After development:

```bash
git push origin feature/user-profile
```

Create a pull request.

After review and successful CI:

```text
Pull Request
     ↓
Merge to main
     ↓
Production deployment
```

Do not automatically deploy every feature branch to production.

---

# 70. Rollback Strategy

A production deployment should have a rollback plan.

Before a risky deployment, identify the current version:

```bash
cd /var/www/pern-app
git rev-parse HEAD
```

If the new deployment fails, inspect the previous commit:

```bash
git log --oneline -10
```

For a simple emergency rollback:

```bash
git reset --hard PREVIOUS_COMMIT
```

Then reinstall/build/restart as required:

```bash
cd server
npm ci
pm2 restart pern-api

cd ../client
npm ci
npm run build

sudo nginx -t
sudo systemctl reload nginx
```

Be careful with database migrations. Application code can be rolled back more
easily than an incompatible database schema. Design migrations so that
deployment and rollback remain safe.

---

# 71. Final CI/CD Checklist

### GitHub

```text
[ ] Repository created
[ ] main branch configured
[ ] .gitignore configured
[ ] .env excluded
[ ] .env.example committed
[ ] CI workflow created
[ ] CD workflow created
```

### GitHub Actions

```text
[ ] Node.js version configured
[ ] npm ci configured
[ ] Lint configured
[ ] Tests configured
[ ] Frontend build configured
[ ] Deploy job configured
[ ] deploy depends on CI
```

### GitHub Secrets

```text
[ ] EC2_HOST
[ ] EC2_USER
[ ] EC2_SSH_KEY
```

### EC2

```text
[ ] Git installed
[ ] Node.js installed
[ ] Nginx installed
[ ] PM2 installed
[ ] Repository cloned
[ ] Production .env configured
[ ] deploy.sh created
[ ] deploy.sh executable
[ ] Git authentication tested
[ ] PM2 application running
```

### Deployment

```text
[ ] Manual deploy works
[ ] GitHub Actions deploy works
[ ] Database migration works
[ ] Frontend build works
[ ] Nginx reload works
[ ] Health check works
[ ] Production URL tested
[ ] Authentication tested
```

### Security

```text
[ ] SSH private key not committed
[ ] Production secrets not committed
[ ] RDS public access disabled
[ ] PostgreSQL port not public
[ ] Node port not public
[ ] HTTPS configured
[ ] GitHub repository permissions reviewed
```

---

# 72. Complete AWS PERN + CI/CD Architecture

```text
                         USERS
                           |
                           v
                    HTTPS :443
                           |
                           v
                    +-------------+
                    |    Nginx    |
                    +------+------+
                           |
                  +--------+--------+
                  |                 |
                  v                 v
           React Static Files    /api/*
                                    |
                                    v
                             +-------------+
                             | Node/Express|
                             |    PM2      |
                             +------+------+
                                    |
                                    | PostgreSQL
                                    v
                             +-------------+
                             | Amazon RDS  |
                             | PostgreSQL  |
                             +-------------+


Developer
    |
    | git push
    v
 GitHub
    |
    v
GitHub Actions
    |
    +--> CI: lint + tests + build
    |
    +--> CD: SSH
             |
             v
            EC2
             |
             +--> git fetch/reset
             +--> npm ci
             +--> migrations
             +--> PM2 restart
             +--> React build
             +--> Nginx reload
             +--> health check
```

---

# 73. Interview Explanation — AWS + CI/CD

If an interviewer asks:

> "How did you deploy your PERN application on AWS and implement CI/CD?"

You can explain:

> "I deployed the React frontend and Node.js/Express backend on an Ubuntu
> EC2 instance. Nginx serves the React production build and acts as a reverse
> proxy for the Express API running under PM2. PostgreSQL is hosted on Amazon
> RDS, with the RDS security group allowing database access only from the EC2
> security group. I configured production environment variables, database
> migrations, HTTPS using Nginx and Let's Encrypt, and GitHub Actions for CI/CD.
> On every push to the main branch, GitHub Actions runs linting, tests and the
> frontend build. If CI succeeds, it connects to EC2 through SSH and runs a
> deployment script that updates the code, installs dependencies, runs
> migrations, rebuilds the frontend, restarts PM2, reloads Nginx and performs
> a health check."

---

# 74. Complete Deployment Flow

```text
1. Create AWS account
        ↓
2. Check Free Tier / credits
        ↓
3. Choose AWS region
        ↓
4. Create EC2
        ↓
5. Configure EC2 Security Group
        ↓
6. SSH into EC2
        ↓
7. Install Git
        ↓
8. Install Node.js
        ↓
9. Install Nginx
        ↓
10. Install PM2
        ↓
11. Create RDS PostgreSQL
        ↓
12. Configure RDS Security Group
        ↓
13. Connect EC2 → RDS
        ↓
14. Clone GitHub repository
        ↓
15. Configure backend .env
        ↓
16. Run database migrations
        ↓
17. Start Express with PM2
        ↓
18. Build React
        ↓
19. Configure Nginx
        ↓
20. Test React
        ↓
21. Test API
        ↓
22. Test PostgreSQL
        ↓
23. Configure domain
        ↓
24. Configure HTTPS
        ↓
25. Test authentication
        ↓
26. Configure monitoring
        ↓
27. Create deploy.sh
        ↓
28. Configure GitHub Actions CI
        ↓
29. Configure GitHub Actions CD
        ↓
30. Add GitHub repository secrets
        ↓
31. Test automatic deployment
        ↓
32. Test health check
        ↓
33. Monitor AWS costs
```

---

# 75. Recommended Learning Order

For becoming strong in AWS deployment and CI/CD as a PERN developer:

```text
1. Linux
   ↓
2. SSH
   ↓
3. Git
   ↓
4. GitHub
   ↓
5. EC2
   ↓
6. Security Groups
   ↓
7. VPC basics
   ↓
8. Nginx
   ↓
9. Node.js deployment
   ↓
10. PM2
   ↓
11. PostgreSQL
   ↓
12. RDS
   ↓
13. DNS
   ↓
14. HTTPS / SSL
   ↓
15. Shell scripting
   ↓
16. GitHub Actions
   ↓
17. CI
   ↓
18. CD
   ↓
19. Deployment strategies
   ↓
20. Rollback
   ↓
21. CloudWatch
   ↓
22. S3
   ↓
23. IAM
   ↓
24. Docker
   ↓
25. ECS/Fargate
```

---

# 76. Deployment Levels

## Level 1 — Learning

```text
EC2
+
RDS
+
Nginx
+
PM2
```

## Level 2 — Portfolio

```text
EC2
+
RDS
+
Nginx
+
HTTPS
+
Domain
+
GitHub Actions CI/CD
+
Health checks
```

## Level 3 — Professional

```text
ALB
+
Multiple EC2/ECS
+
RDS
+
S3
+
CloudFront
+
Secrets Manager
+
CloudWatch
+
Auto Scaling
+
CI/CD
```

## Level 4 — Advanced

```text
Route 53
+
CloudFront
+
WAF
+
ECS/Fargate
+
RDS Multi-AZ
+
ElastiCache
+
SQS
+
CloudWatch
+
Terraform
+
GitHub Actions
```

Do not build Level 3/4 infrastructure just to deploy a small portfolio
application.

---

# 77. Final End-to-End Checklist

### AWS

```text
[ ] AWS account created
[ ] Free Tier/credits checked
[ ] Billing alerts configured
[ ] Region selected
```

### EC2

```text
[ ] Free Tier eligible instance selected
[ ] Ubuntu installed
[ ] Key pair created
[ ] SSH configured
[ ] Security Group configured
```

### Server

```text
[ ] Git installed
[ ] Node.js installed
[ ] Nginx installed
[ ] PM2 installed
[ ] Application cloned
[ ] Production .env configured
```

### RDS

```text
[ ] PostgreSQL created
[ ] Free Tier eligibility checked
[ ] RDS Security Group created
[ ] Public access disabled
[ ] EC2 → RDS connection tested
[ ] Database migrations executed
```

### Backend

```text
[ ] Database connected
[ ] API tested
[ ] PM2 configured
[ ] PM2 startup enabled
[ ] Health endpoint created
```

### Frontend

```text
[ ] Production environment configured
[ ] React build generated
[ ] Nginx root configured
[ ] React Router fallback configured
```

### Networking

```text
[ ] Port 22 secured
[ ] Port 80 enabled
[ ] Port 443 enabled
[ ] Port 5000 not publicly exposed
[ ] Port 5432 not publicly exposed
```

### HTTPS

```text
[ ] Domain configured
[ ] DNS configured
[ ] Certbot installed
[ ] SSL certificate issued
[ ] Renewal tested
```

### CI/CD

```text
[ ] deploy.sh created
[ ] deploy.sh tested manually
[ ] CI workflow created
[ ] Lint configured
[ ] Tests configured
[ ] Frontend build configured
[ ] CD workflow created
[ ] EC2_HOST secret configured
[ ] EC2_USER secret configured
[ ] EC2_SSH_KEY secret configured
[ ] EC2 GitHub authentication configured
[ ] Automatic deployment tested
[ ] Health check tested
[ ] Rollback process understood
```

### Security

```text
[ ] No secrets in Git
[ ] Strong DB password
[ ] Strong JWT secret
[ ] CORS configured
[ ] Helmet configured
[ ] Rate limiting considered
[ ] Input validation enabled
[ ] RDS is private
[ ] SSH key secured
```

### Cost

```text
[ ] Free Tier status checked
[ ] RDS storage checked
[ ] EC2 usage checked
[ ] Public IPv4 costs checked
[ ] Unused resources removed
[ ] Billing dashboard reviewed
```

---

# 78. End Goal

After completing this guide, you will have a real AWS-hosted PERN application
using:

```text
React.js
   +
Node.js
   +
Express.js
   +
PostgreSQL
   +
EC2
   +
RDS
   +
Nginx
   +
PM2
   +
Security Groups
   +
HTTPS
   +
GitHub
   +
GitHub Actions
   +
CI
   +
CD
   +
Database Migrations
   +
Health Checks
   +
Deployment Script
   +
Rollback Strategy
```

The resulting workflow is:

```text
Code
 ↓
Git Push
 ↓
GitHub
 ↓
GitHub Actions
 ↓
Lint
 ↓
Tests
 ↓
Build
 ↓
SSH
 ↓
EC2
 ↓
Deploy Script
 ↓
Database Migration
 ↓
PM2 Restart
 ↓
React Build
 ↓
Nginx Reload
 ↓
Health Check
 ↓
Live PERN Application
```

This provides a practical foundation for learning AWS deployment, Linux,
Nginx, PM2, PostgreSQL/RDS, GitHub Actions, CI/CD, HTTPS and production
deployment for PERN/MERN full-stack development.
# 54. Database Backups

RDS provides managed backup capabilities, but backup storage and
retention are subject to your current Free Tier/account limits.

For a portfolio application:

-   Keep the database small.
-   Use reasonable backup retention.
-   Do not create unnecessary snapshots.
-   Monitor backup storage.
-   Test restoring a backup before trusting it.

A backup that has never been restored is not fully verified.

------------------------------------------------------------------------

# 55. Database Migration Strategy

Never manually modify production tables without tracking the change.

Use migrations:

``` text
migration 001
migration 002
migration 003
...
```

Recommended flow:

``` text
Local development
       ↓
Migration created
       ↓
Git commit
       ↓
CI/CD
       ↓
Production migration
       ↓
Application restart
```

------------------------------------------------------------------------

# 56. Security Checklist

## EC2

-   [ ] SSH restricted to your IP
-   [ ] HTTP 80 open
-   [ ] HTTPS 443 open
-   [ ] No unnecessary ports
-   [ ] OS updated
-   [ ] `.env` protected
-   [ ] SSH private key secured

## RDS

-   [ ] Public access disabled
-   [ ] Port 5432 not open to the internet
-   [ ] RDS Security Group allows EC2 Security Group
-   [ ] Strong password
-   [ ] Reasonable backup settings
-   [ ] Database credentials not committed

## Express

-   [ ] CORS configured
-   [ ] Helmet enabled where appropriate
-   [ ] Rate limiting considered
-   [ ] Request validation
-   [ ] Authentication protected
-   [ ] Passwords hashed
-   [ ] JWT secret strong
-   [ ] Production errors do not expose secrets

## React

-   [ ] No secrets in frontend environment variables
-   [ ] Production API URL configured
-   [ ] Production build used
-   [ ] Source maps considered based on project needs

------------------------------------------------------------------------

# 57. Important Frontend Secret Rule

Anything bundled into React can be viewed by users.

Never put:

``` text
DB_PASSWORD
JWT_SECRET
AWS_SECRET_ACCESS_KEY
PRIVATE_API_SECRET
```

inside:

``` text
VITE_*
REACT_APP_*
```

Frontend environment variables are not server secrets.

------------------------------------------------------------------------

# 58. Express Security Packages

A typical production Express project may use:

``` bash
npm install helmet cors express-rate-limit
```

Example:

``` js
import helmet from "helmet";
import rateLimit from "express-rate-limit";

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use("/api", limiter);
```

Tune limits according to your application.

------------------------------------------------------------------------

# 59. Authentication Architecture

Recommended:

``` text
React
  |
  | Login
  v
Express
  |
  | Verify user
  v
PostgreSQL
  |
  | User data
  v
Express
  |
  | Secure token/cookie
  v
React
```

For cookie-based authentication:

``` text
httpOnly
secure
sameSite
```

should be configured appropriately for your deployment.

------------------------------------------------------------------------

# 60. Production Error Handling

Never return:

``` json
{
  "error": "password authentication failed for user postgres"
}
```

to the browser.

Instead:

``` json
{
  "message": "Internal server error"
}
```

Log the detailed error server-side.

------------------------------------------------------------------------

# 61. Logging

PM2:

``` bash
pm2 logs pern-api
```

Nginx:

``` bash
sudo tail -f /var/log/nginx/access.log
```

``` bash
sudo tail -f /var/log/nginx/error.log
```

For larger systems, CloudWatch Logs can be considered.

------------------------------------------------------------------------

# 62. Monitoring

Basic checks:

``` bash
pm2 status
free -h
df -h
top
```

AWS:

``` text
CloudWatch
```

Monitor:

``` text
CPU
Network
Disk
EC2 status
RDS CPU
RDS connections
RDS storage
```

Monitoring beyond Free Tier limits can incur charges, so verify current
AWS pricing before enabling additional services.

------------------------------------------------------------------------

# 63. Free-Friendly Performance Optimization

Because a micro instance has limited resources:

### Backend

Use:

``` text
1 PM2 process
small DB connection pool
pagination
database indexes
efficient queries
compression where appropriate
```

Avoid unnecessarily running:

``` text
multiple Node workers
large background jobs
memory-heavy processes
```

### Frontend

Use:

``` text
code splitting
lazy loading
image optimization
production build
tree shaking
```

------------------------------------------------------------------------

# 64. PostgreSQL Optimization

Create indexes for frequently queried columns.

Example:

``` sql
CREATE INDEX idx_users_email
ON users(email);
```

Use:

``` sql
EXPLAIN ANALYZE
```

to investigate slow queries.

Do not create indexes for every column.

------------------------------------------------------------------------

# 65. Database Connection Security

Correct:

``` text
Internet
   |
   v
EC2
   |
   v
RDS PostgreSQL
```

Incorrect:

``` text
Internet
   |
   v
RDS PostgreSQL :5432
```

Your RDS security group should allow PostgreSQL traffic from the EC2
security group.

------------------------------------------------------------------------

# 66. Optional S3 Integration

If your PERN application has:

-   profile images
-   documents
-   invoices
-   product images
-   videos

you can use:

``` text
Amazon S3
```

Architecture:

``` text
React
  |
  v
Express
  |
  v
S3
```

For larger file uploads, consider presigned URLs:

``` text
React
  |
  | request upload URL
  v
Express
  |
  v
S3 Presigned URL
  |
  v
React
  |
  v
S3
```

Check current AWS Free Tier limits before using S3 at scale.

------------------------------------------------------------------------

# 67. What NOT to Store on EC2

Avoid storing important permanent user uploads directly on:

``` text
/var/www/pern-app/uploads
```

EC2 local storage is not a replacement for object storage.

For persistent user files, use:

``` text
S3
```

------------------------------------------------------------------------

# 68. Deployment Without a Custom Domain

If you don't want to purchase a domain:

``` text
React
   ↓
Nginx
   ↓
EC2 Public IP
   ↓
Express
   ↓
RDS
```

URL:

``` text
http://EC2_PUBLIC_IP
```

This is suitable for:

-   learning
-   portfolio demos
-   internal testing
-   temporary projects

For a public production application, HTTPS and a proper domain are
strongly recommended.

------------------------------------------------------------------------

# 69. Cost-Control Checklist

Before finishing:

``` text
[ ] EC2 is Free Tier eligible
[ ] RDS is Free Tier eligible
[ ] EC2 and RDS are in the same region
[ ] RDS is Single-AZ for this small deployment
[ ] RDS is not publicly accessible
[ ] No NAT Gateway
[ ] No unnecessary Load Balancer
[ ] No unnecessary Elastic IP
[ ] No unused EBS volumes
[ ] No unnecessary snapshots
[ ] No unused RDS databases
[ ] Billing alerts configured
[ ] Free Tier usage monitored
```

AWS currently charges for some public IPv4 usage, so do not assume a
public IP is permanently free.

------------------------------------------------------------------------

# 70. Cleanup When You Stop Using the Project

If you no longer need the application:

## Terminate EC2

``` text
EC2
→ Instances
→ Terminate instance
```

## Delete RDS

``` text
RDS
→ Database
→ Delete
```

Be careful with:

``` text
Final snapshot
```

Snapshots can incur storage charges.

Also check:

``` text
EBS volumes
Snapshots
Elastic IPs
S3 buckets
Load Balancers
NAT Gateways
CloudWatch resources
```

------------------------------------------------------------------------

# 71. Complete Deployment Flow

The complete process is:

``` text
1. Create AWS account
        ↓
2. Check Free Tier / credits
        ↓
3. Choose AWS region
        ↓
4. Create EC2
        ↓
5. Configure EC2 Security Group
        ↓
6. SSH into EC2
        ↓
7. Install Git
        ↓
8. Install Node.js
        ↓
9. Install Nginx
        ↓
10. Install PM2
        ↓
11. Create RDS PostgreSQL
        ↓
12. Configure RDS Security Group
        ↓
13. Connect EC2 → RDS
        ↓
14. Clone GitHub repository
        ↓
15. Configure backend .env
        ↓
16. Run database migrations
        ↓
17. Start Express with PM2
        ↓
18. Build React
        ↓
19. Configure Nginx
        ↓
20. Test React
        ↓
21. Test API
        ↓
22. Test PostgreSQL
        ↓
23. Configure domain
        ↓
24. Configure HTTPS
        ↓
25. Test authentication
        ↓
26. Configure monitoring
        ↓
27. Add CI/CD
        ↓
28. Monitor AWS costs
```

------------------------------------------------------------------------

# 72. Final Production Architecture

``` text
                         USERS
                           |
                           v
                    HTTPS :443
                           |
                           v
                    +-------------+
                    |    Nginx    |
                    +------+------+
                           |
              +------------+------------+
              |                         |
              v                         v
       React Static Files        /api/*
                                      |
                                      v
                               +-------------+
                               | Node/Express|
                               |    PM2      |
                               +------+------+
                                      |
                                      | PostgreSQL
                                      v
                               +-------------+
                               | Amazon RDS  |
                               | PostgreSQL  |
                               +-------------+
```

------------------------------------------------------------------------

# 73. Interview Explanation

If an interviewer asks:

> "How did you deploy your PERN application on AWS?"

You can explain:

> "I deployed the React frontend and Node.js/Express backend on an
> Ubuntu EC2 instance. Nginx serves the React production build and works
> as a reverse proxy for the Express API running under PM2. PostgreSQL
> is hosted on Amazon RDS inside the same AWS region, and the RDS
> security group only allows PostgreSQL traffic from the EC2 security
> group. I configured environment variables for production credentials,
> database migrations, HTTPS using Nginx and Let's Encrypt, and used
> GitHub Actions for optional CI/CD."

------------------------------------------------------------------------

# 74. Recommended Learning Order

For becoming strong in AWS deployment as a PERN developer:

``` text
1. Linux
   ↓
2. SSH
   ↓
3. EC2
   ↓
4. Security Groups
   ↓
5. VPC basics
   ↓
6. Nginx
   ↓
7. Node.js deployment
   ↓
8. PM2
   ↓
9. PostgreSQL
   ↓
10. RDS
   ↓
11. DNS
   ↓
12. HTTPS / SSL
   ↓
13. GitHub Actions
   ↓
14. CloudWatch
   ↓
15. S3
   ↓
16. IAM
   ↓
17. Docker
   ↓
18. ECS/Fargate
```

------------------------------------------------------------------------

# 75. Free Deployment Level vs Production Scaling

## Level 1 --- Learning

``` text
EC2
+
RDS
+
Nginx
+
PM2
```

## Level 2 --- Portfolio

``` text
EC2
+
RDS
+
Nginx
+
HTTPS
+
Domain
+
GitHub Actions
```

## Level 3 --- Professional

``` text
ALB
+
Multiple EC2/ECS
+
RDS
+
S3
+
CloudFront
+
Secrets Manager
+
CloudWatch
+
Auto Scaling
+
CI/CD
```

## Level 4 --- Advanced

``` text
Route 53
+
CloudFront
+
WAF
+
ECS/Fargate
+
RDS Multi-AZ
+
ElastiCache
+
SQS
+
CloudWatch
+
Terraform
+
GitHub Actions
```

Do not build Level 3/4 infrastructure just to deploy a small portfolio
application.

------------------------------------------------------------------------

# 76. Final Checklist

### AWS

-   [ ] AWS account created
-   [ ] Free Tier/credits checked
-   [ ] Billing alerts configured
-   [ ] Region selected

### EC2

-   [ ] Free Tier eligible instance selected
-   [ ] Ubuntu installed
-   [ ] Key pair created
-   [ ] SSH configured
-   [ ] Security Group configured

### Server

-   [ ] Git installed
-   [ ] Node.js installed
-   [ ] Nginx installed
-   [ ] PM2 installed
-   [ ] Application cloned

### RDS

-   [ ] PostgreSQL created
-   [ ] Free Tier eligibility checked
-   [ ] RDS Security Group created
-   [ ] Public access disabled
-   [ ] EC2 → RDS connection tested
-   [ ] Database migrations executed

### Backend

-   [ ] `.env` configured
-   [ ] Database connected
-   [ ] API tested
-   [ ] PM2 configured
-   [ ] PM2 startup enabled

### Frontend

-   [ ] Production environment configured
-   [ ] React build generated
-   [ ] Nginx root configured
-   [ ] React Router fallback configured

### Networking

-   [ ] Port 22 restricted
-   [ ] Port 80 enabled
-   [ ] Port 443 enabled
-   [ ] Port 5000 not publicly exposed
-   [ ] Port 5432 not publicly exposed

### HTTPS

-   [ ] Domain configured
-   [ ] DNS configured
-   [ ] Certbot installed
-   [ ] SSL certificate issued
-   [ ] Renewal tested

### CI/CD

-   [ ] GitHub Actions configured
-   [ ] EC2 SSH secret configured
-   [ ] Deployment script created
-   [ ] Automatic deployment tested

### Security

-   [ ] No secrets in Git
-   [ ] Strong DB password
-   [ ] Strong JWT secret
-   [ ] CORS configured
-   [ ] Helmet configured
-   [ ] Rate limiting considered
-   [ ] Input validation enabled

### Cost

-   [ ] Free Tier status checked
-   [ ] RDS storage checked
-   [ ] EC2 usage checked
-   [ ] Public IPv4 costs checked
-   [ ] Unused resources removed
-   [ ] Billing dashboard reviewed

------------------------------------------------------------------------

# 77. Important AWS Free-Tier Notes

AWS Free Tier eligibility depends on account creation date, plan,
service, region, and current offer terms. The exact limits can change.

As of the current AWS documentation:

-   New AWS customers can receive **\$100 in AWS credits** and may earn
    up to another **\$100** through eligible activities.
-   The AWS Free account plan is intended for experimenting for up to
    **six months**, or until credits are exhausted.
-   RDS currently lists Free Tier options including `db.t3.micro` and
    `db.t4g.micro` for PostgreSQL.
-   EC2 instance eligibility depends on the account and current Free
    Tier rules.
-   Public IPv4 addresses can have standard charges.
-   Usage beyond Free Tier/credits can be billed.
-   Always check the AWS Console's current Free Tier label and billing
    information before launching resources.

Official documentation:

-   AWS Free Tier: https://aws.amazon.com/free/
-   AWS Free Tier documentation:
    https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html
-   EC2 documentation: https://docs.aws.amazon.com/ec2/
-   RDS PostgreSQL documentation:
    https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html
-   RDS Free Tier: https://aws.amazon.com/rds/free/

------------------------------------------------------------------------

# 78. End Goal

After completing this guide, you will have a real AWS-hosted PERN
application using:

``` text
React.js
   +
Node.js
   +
Express.js
   +
PostgreSQL
   +
EC2
   +
RDS
   +
Nginx
   +
PM2
   +
Security Groups
   +
HTTPS
   +
GitHub
   +
CI/CD
```

This is a strong foundation for learning **AWS deployment for PERN/MERN
full-stack development** without starting with unnecessarily complex
infrastructure.
