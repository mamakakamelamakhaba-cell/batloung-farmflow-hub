# Batloung Farm Distribution System

A fruit distribution management system for a Maseru trading operation (Lesotho), buying
produce from suppliers in the eight South African provinces.  
**Stack:** React + Vite (plain JavaScript) · Express API · MySQL (Aiven).

---

## Project layout

| Path | Purpose |
|------|---------|
| `database/schema.sql` | Tables, constraints, stored procedures |
| `database/seed.sql` | 8 suppliers · 6 fruits · 6 vendors · 6 purchases · 6 sales · 5 payments |
| `config/db.js` | MySQL connection pool (Aiven SSL) |
| `server/index.js` | Production server – serves API + built UI |
| `server/dev.js` | Dev server – Vite HMR + API on one port |
| `server/api.js` | REST routes |
| `server/farm.repository.js` | Data access layer |
| `src/main.jsx` | React entry point |
| `src/lib/api.js` | API hooks (React Query) |
| `src/components/farm/FarmApp.jsx` | All screens |
| `scripts/init-db.js` | Creates tables + seeds data |
| `scripts/check-db.js` | Connectivity + row-count check |

---

## 1 · Prerequisites

- **Node.js 20 or newer** — check with `node -v`
- An **Aiven MySQL** service (you already have one — see the screenshots above)

---

## 2 · Local setup

### a) Clone / download

```bash
# If you are starting fresh from the zip:
cd batloung-farmflow-hub
```

### b) Copy environment variables

```bash
cp .env.example .env
```

Open `.env` and confirm these values match your Aiven dashboard:

```
DB_HOST=batloungfarm-mamakakelamakhaba-d586.f.aivencloud.com
DB_PORT=12157
DB_USER=avnadmin
DB_PASSWORD=YOUR_AIVEN_PASSWORD_HERE
DB_NAME=defaultdb
DB_SSL=true
```

> **TLS note:** For local dev, download the **CA certificate** from Aiven  
> (*Connection information → CA certificate → Download*) and save it as `ca.pem`  
> in the project root, then add `DB_CA_PATH=./ca.pem` to `.env`.  
> On Render/Vercel the connection still works without `ca.pem` (SSL is still required).

### c) Install dependencies

```bash
npm install
```

### d) Create tables and load seed data

```bash
npm run db:init
```

This creates every table and loads:

| Table | Records |
|-------|---------|
| suppliers | **8** (one per SA province) |
| fruits | **6** (Apples, Bananas, Oranges, Mangoes, Grapes, Pears) |
| vendors | **6** (Maseru, Leribe, Berea, Mafeteng, Qacha's Nek, Mokhotlong) |
| purchases | **6** with line items |
| sales | **6** with line items |
| payments | **5** |
| stock | **18** (fruit × package size) |

Re-run any time — it truncates and reloads safely.

```bash
npm run db:check   # verify connection + row counts
```

### e) Run in development

```bash
npm run dev
```

Open <http://localhost:5173>.  The sidebar shows **System connected** when the API is healthy.

### f) Build for production (test locally)

```bash
npm run build
npm start
```

Open <http://localhost:3000>.

---

## 3 · Push to GitHub

> Do this **before** deploying to Render or Vercel.

```bash
# Step 1 – initialise git (skip if already done)
git init

# Step 2 – stage everything (.env and ca.pem are excluded by .gitignore)
git add .

# Step 3 – first commit
git commit -m "Batloung Farm Distribution System — Aiven MySQL backend"

# Step 4 – rename default branch to main
git branch -M main

# Step 5 – add your GitHub repo as the remote
#   Replace YOUR-USERNAME and YOUR-REPO with your actual GitHub username and repo name
git remote add origin https://github.com/YOUR-USERNAME/batloung-farmflow-hub.git

# Step 6 – push
git push -u origin main
```

> **If the repo already exists on GitHub:**  
> Skip step 1 and go straight to `git add . → commit → push`.

---

## 4 · Deploy to Render (recommended for the Express server)

Render runs the Express server **and** serves the built front-end — one service, no serverless cold starts.

1. Go to <https://dashboard.render.com> and click **New → Web Service**.
2. Connect your GitHub account and select **batloung-farmflow-hub**.
3. Set these fields:

   | Field | Value |
   |-------|-------|
   | **Environment** | Node |
   | **Region** | Frankfurt (closest to Lesotho) |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |
   | **Plan** | Free |

4. Under **Environment Variables**, add:

    | Key | Value |
    |-----|-------|
    | `NODE_ENV` | `production` |
    | `DB_HOST` | `batloungfarm-mamakakelamakhaba-d586.f.aivencloud.com` |
    | `DB_PORT` | `12157` |
    | `DB_USER` | `avnadmin` |
    | `DB_PASSWORD` | `YOUR_AIVEN_PASSWORD_HERE` |
    | `DB_NAME` | `defaultdb` |
    | `DB_SSL` | `true` |

5. Click **Create Web Service**. Render builds and deploys automatically.  
   Your URL will be something like `https://batloung-farmflow-hub.onrender.com`.

> **Free-tier note:** Render free services sleep after 15 minutes of inactivity.  
> The first request after sleep takes ~30 seconds to wake up.

---

## 5 · Deploy to Vercel (front-end + API routes)

Vercel is ideal for the front-end. The `vercel.json` already routes all traffic through the Express server.

1. Go to <https://vercel.com/new> and import **batloung-farmflow-hub** from GitHub.
2. Set **Framework Preset** to **Other** (or Vite).
3. Under **Environment Variables**, add the same 7 keys listed in the Render table above.
4. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
5. Click **Deploy**.

> **Important:** Vercel runs your Express server as a serverless function.  
> The MySQL connection pool reconnects on every cold start, which is fine for Aiven.

---

## 6 · API reference

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Connection status + row counts |
| `GET/POST/PUT/DELETE` | `/api/suppliers`, `/api/suppliers/:id` | Suppliers (province required) |
| `GET/POST/PUT` | `/api/fruits`, `/api/fruits/:id` | Fruit catalogue + prices |
| `GET/POST/PUT` | `/api/vendors`, `/api/vendors/:id` | Vendors |
| `GET` | `/api/vendors/balances` | Outstanding balances |
| `GET` | `/api/stock`, `/api/stock/low` | Stock on hand |
| `GET/POST` | `/api/purchases` | Purchases (adds stock) |
| `GET/POST` | `/api/sales` | Sales (checks + reduces stock) |
| `POST` | `/api/sales/:id/payments` | Record a payment |
| `GET` | `/api/reports/summary`, `/top-fruits`, `/top-vendor`, `/stock`, `/revenue` | Reports |

---

## 7 · Troubleshooting

| Message | Fix |
|---------|-----|
| `Cannot reach the database. Check DB_HOST` | Copy the exact Host from Aiven (it changes if the service is recreated). |
| `The database rejected the login` | Re-check `DB_USER` / `DB_PASSWORD`. |
| `The tables are missing` | Run `npm run db:init`. |
| `self-signed certificate` / TLS error | Save Aiven CA cert as `ca.pem` and add `DB_CA_PATH=./ca.pem` to `.env`. |
| Sidebar shows *Connection unavailable* | API running but cannot reach MySQL — run `npm run db:check`. |
| Render deploy fails on `npm install` | Make sure `package.json` is committed and not in `.gitignore`. |
