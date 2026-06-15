# Deployment Guide — ServiceSaaS

Full walkthrough to migrate from local SQLite to **Supabase (PostgreSQL)**, push to **GitHub**, and deploy frontend + backend to **Vercel**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1 — Supabase Setup](#3-step-1--supabase-setup)
4. [Step 2 — Supabase Storage (File Uploads)](#4-step-2--supabase-storage-file-uploads)
5. [Step 3 — Migrate Backend to PostgreSQL](#5-step-3--migrate-backend-to-postgresql)
6. [Step 4 — Environment Variables](#6-step-4--environment-variables)
7. [Step 5 — Push to GitHub](#7-step-5--push-to-github)
8. [Step 6 — Deploy Backend to Vercel](#8-step-6--deploy-backend-to-vercel)
9. [Step 7 — Deploy Frontend to Vercel](#9-step-7--deploy-frontend-to-vercel)
10. [Step 8 — Connect Frontend to Backend](#10-step-8--connect-frontend-to-backend)
11. [Post-Deployment Checklist](#11-post-deployment-checklist)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Vercel (Frontend) │────▶│  Vercel (Backend API) │────▶│    Supabase     │
│   React + Vite SPA  │     │   Node.js / Express   │     │  PostgreSQL DB  │
│                     │     │                       │     │  File Storage   │
└─────────────────────┘     └──────────────────────┘     └─────────────────┘
```

- **Frontend** — React SPA deployed as a Vercel static site
- **Backend** — Express API deployed as Vercel Serverless Functions
- **Database** — Supabase PostgreSQL (replaces SQLite)
- **File Storage** — Supabase Storage bucket (replaces local `/uploads` folder)

---

## 2. Prerequisites

Install these tools before starting:

| Tool | Install |
|------|---------|
| Node.js 18+ | https://nodejs.org |
| Git | https://git-scm.com |
| Vercel CLI | `npm install -g vercel` |
| GitHub account | https://github.com |
| Supabase account | https://supabase.com |
| Vercel account | https://vercel.com |

---

## 3. Step 1 — Supabase Setup

### 3.1 Create a new project

1. Go to [https://supabase.com](https://supabase.com) → **New Project**
2. Choose your organization
3. Fill in:
   - **Name**: `servicesaas` (or any name)
   - **Database Password**: generate a strong password — **save it**
   - **Region**: choose closest to your users
4. Click **Create new project** — takes ~2 minutes

### 3.2 Get your connection string

1. In your Supabase project → **Settings** (gear icon) → **Database**
2. Scroll to **Connection string** → choose **URI** tab
3. Copy the string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual password
5. **Save this — you will need it as `DATABASE_URL`**

### 3.3 Run the SQL schema

1. In Supabase → **SQL Editor** → **New query**
2. Paste the entire block below and click **Run**:

```sql
-- ── SUPER ADMIN ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS super_admins (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── BUSINESSES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  logo_url TEXT DEFAULT '',
  hero_image_url TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  about TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  map_url TEXT DEFAULT '',
  admin_password TEXT DEFAULT '',
  color_primary TEXT DEFAULT '#2563eb',
  color_secondary TEXT DEFAULT '#7c3aed',
  color_tertiary TEXT DEFAULT '#0891b2',
  staff_display INTEGER DEFAULT 1,
  gallery_display INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── WORK HOURS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS work_hours (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open INTEGER DEFAULT 1,
  open_time TEXT DEFAULT '09:00',
  close_time TEXT DEFAULT '18:00',
  UNIQUE(business_id, day_of_week)
);

-- ── SERVICE CATEGORIES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- ── SERVICES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  duration TEXT DEFAULT '',
  time_windows TEXT DEFAULT '',
  category_id INTEGER REFERENCES service_categories(id) ON DELETE SET NULL,
  visible INTEGER NOT NULL DEFAULT 1,
  show_gallery INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SERVICE IMAGES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_images (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── STAFF ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  visible INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RESERVATIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT DEFAULT '',
  ip_address TEXT DEFAULT ''
);

-- ── FEEDBACK ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  approved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEED: default super admin ─────────────────────────────────────────────────
-- Change 'Yo2906' to a strong password before going live
INSERT INTO super_admins (username, password_hash)
VALUES ('admin', 'Yo2906')
ON CONFLICT (username) DO NOTHING;
```

3. Click **Run** — you should see "Success. No rows returned"

---

## 4. Step 2 — Supabase Storage (File Uploads)

### 4.1 Create a storage bucket

1. In Supabase → **Storage** (left sidebar)
2. Click **New bucket**
3. Name: `uploads`
4. Toggle **Public bucket** → ON (so uploaded images are publicly accessible)
5. Click **Create bucket**

### 4.2 Set bucket policy

1. Click on the `uploads` bucket → **Policies** tab
2. Click **New policy** → **For full customization**
3. Create a policy:
   - **Policy name**: `public-read`
   - **Allowed operations**: SELECT
   - **Target roles**: Leave blank (public)
   - **Policy definition**: `true`
4. Create another policy:
   - **Policy name**: `service-role-write`
   - **Allowed operations**: INSERT, UPDATE, DELETE
   - **Target roles**: `service_role`
   - **Policy definition**: `true`

### 4.3 Get Storage keys

1. Supabase → **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **service_role** key (under "Project API keys") — **keep this secret**

---

## 5. Step 3 — Migrate Backend to PostgreSQL

The backend currently uses `better-sqlite3` (synchronous). PostgreSQL uses the `pg` library (async/await). Follow these steps:

### 5.1 Install new dependencies

```bash
cd backend
npm install pg @supabase/supabase-js
npm uninstall better-sqlite3
```

### 5.2 Replace `backend/db.js`

Delete the current `db.js` and create a new one:

```js
// backend/db.js  — PostgreSQL version
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }   // required for Supabase
});

// Helper: run a query and return rows
async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

// Helper: run a query and return the first row
async function queryOne(text, params) {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
}

// Resolve business_id from request
function getBusinessId(req) {
  const id = req.headers['x-business-id'] || req.query.business_id || req.body?.business_id;
  return id ? parseInt(id, 10) : null;
}

// Get active business or send 404
async function requireBusiness(req, res) {
  const id = getBusinessId(req);
  if (!id) {
    res.status(400).json({ error: 'business_id is required' });
    return null;
  }
  const biz = await queryOne(
    "SELECT * FROM businesses WHERE id = $1 AND status = 'active'", [id]
  );
  if (!biz) {
    res.status(404).json({ error: 'Business not found or inactive' });
    return null;
  }
  return biz;
}

module.exports = { pool, query, queryOne, getBusinessId, requireBusiness };
```

### 5.3 Update all route files

Every route file needs to change from synchronous SQLite calls to `async/await` PostgreSQL calls.

**Key differences:**
- SQLite: `db.prepare('SELECT ...').get(id)` → PG: `await queryOne('SELECT ... WHERE id = $1', [id])`
- SQLite: `db.prepare('INSERT ...').run(...)` → PG: `await query('INSERT ... RETURNING id', [...])`
- SQLite: `db.prepare('SELECT ...').all(...)` → PG: `await query('SELECT ...', [...])`
- Parameter placeholders: `?` → `$1, $2, $3...`
- All route handlers must be `async (req, res) => { ... }`
- Wrap in try/catch blocks

**Example — before (SQLite):**
```js
router.get('/', (req, res) => {
  const biz = requireBusiness(req, res);
  if (!biz) return;
  const cats = db.prepare('SELECT * FROM service_categories WHERE business_id = ?').all(biz.id);
  res.json(cats);
});
```

**Example — after (PostgreSQL):**
```js
router.get('/', async (req, res) => {
  try {
    const biz = await requireBusiness(req, res);
    if (!biz) return;
    const cats = await query(
      'SELECT * FROM service_categories WHERE business_id = $1 ORDER BY sort_order ASC, name ASC',
      [biz.id]
    );
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

Apply this pattern to all 9 route files: `superadmin.js`, `business.js`, `serviceCategories.js`, `services.js`, `workHours.js`, `staff.js`, `reservations.js`, `feedback.js`, `analytics.js`.

### 5.4 Replace file upload handling

Instead of writing to a local `/uploads` folder (which doesn't persist on Vercel), upload to Supabase Storage.

Add a helper in `db.js` or a new `storage.js`:

```js
// backend/storage.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function uploadFile(file) {
  const ext  = path.extname(file.originalname).toLowerCase();
  const name = `${file.fieldname}_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(name, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(name);

  return publicUrl;  // e.g. https://xxx.supabase.co/storage/v1/object/public/uploads/logo_xxx.png
}

async function deleteFile(publicUrl) {
  if (!publicUrl || !publicUrl.includes('/uploads/')) return;
  // Extract filename from URL
  const name = publicUrl.split('/uploads/').pop();
  await supabase.storage.from('uploads').remove([name]);
}

module.exports = { uploadFile, deleteFile };
```

In each route that handles uploads, change multer to use `memoryStorage` (keeps file in RAM for upload to Supabase) instead of `diskStorage`:

```js
// Before (disk storage):
const storage = multer.diskStorage({ destination: ..., filename: ... });
const upload  = multer({ storage });

// After (memory storage for Supabase):
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
```

Then in route handlers:
```js
// Before:
const logo_url = req.file ? `/uploads/${req.file.filename}` : '';

// After:
const logo_url = req.file ? await uploadFile(req.file) : '';
```

---

## 6. Step 4 — Environment Variables

### Backend `.env` (for local dev)

Create `backend/.env` based on `.env.example`:

```env
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

# Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_KEY=eyJhb...   ← service_role key from Supabase Settings > API
```

> ⚠️ **Never commit `.env` to Git.** The `.gitignore` already excludes it.

### Frontend `.env` (for local dev)

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
```

In production (Vercel), this will point to your deployed backend URL.

---

## 7. Step 5 — Push to GitHub

### 7.1 Create `.gitignore` at the project root

```
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Environment files
.env
backend/.env
frontend/.env
frontend/.env.local

# SQLite database (not needed — using Supabase)
backend/data/
*.db
*.db-shm
*.db-wal

# Local uploads (replaced by Supabase Storage)
backend/uploads/

# Build output
frontend/dist/
dist/

# OS files
.DS_Store
Thumbs.db
```

### 7.2 Initialize Git and push

```bash
# From the project root (services template folder)
git init
git add .
git commit -m "Initial commit — ServiceSaaS platform"
```

### 7.3 Create a GitHub repository

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `servicesaas` (or your preferred name)
3. Visibility: **Private** (recommended — contains admin credentials)
4. Click **Create repository**
5. Follow GitHub's instructions to push:

```bash
git remote add origin https://github.com/YOUR-USERNAME/servicesaas.git
git branch -M main
git push -u origin main
```

---

## 8. Step 6 — Deploy Backend to Vercel

Vercel runs Node.js via serverless functions. We need a `vercel.json` to route all `/api/*` requests to the Express app.

### 8.1 Create `backend/vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

### 8.2 Deploy via Vercel CLI

```bash
cd backend
vercel
```

Follow the prompts:
- **Set up and deploy**: Y
- **Which scope**: your account
- **Link to existing project**: N
- **Project name**: `servicesaas-api`
- **In which directory is your code located**: `./` (current)
- **Want to override the settings**: N

### 8.3 Add environment variables

```bash
vercel env add DATABASE_URL
# paste your Supabase connection string

vercel env add SUPABASE_URL
# paste https://xxxx.supabase.co

vercel env add SUPABASE_SERVICE_KEY
# paste your service_role key

vercel env add ALLOWED_ORIGINS
# paste your frontend Vercel URL (you'll update this after frontend deploy)

vercel env add NODE_ENV
# type: production
```

Or add them in the Vercel dashboard:
1. Go to [https://vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables**
2. Add each variable above

### 8.4 Deploy to production

```bash
vercel --prod
```

Your backend will be live at: `https://servicesaas-api.vercel.app`

> **Note**: Vercel serverless functions have a read-only filesystem — this is why we migrated file uploads to Supabase Storage instead of writing to disk.

---

## 9. Step 7 — Deploy Frontend to Vercel

### 9.1 Create `frontend/vercel.json`

This handles client-side routing (so React Router works on direct URL access):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 9.2 Deploy via Vercel CLI

```bash
cd frontend
vercel
```

Follow the prompts:
- **Project name**: `servicesaas`
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Install command**: `npm install`

### 9.3 Add environment variable

```bash
vercel env add VITE_API_URL
# paste your backend URL: https://servicesaas-api.vercel.app
```

### 9.4 Update `frontend/src/api.js`

Change the `baseURL` to use the env variable:

```js
// Before:
const api = axios.create({ baseURL: '/api', ... });

// After:
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  ...
});

// And for superAdminApi:
const superAdminApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api/superadmin`,
  ...
});
```

### 9.5 Deploy to production

```bash
vercel --prod
```

Your frontend will be live at: `https://servicesaas.vercel.app`

---

## 10. Step 8 — Connect Frontend to Backend

### 10.1 Update CORS on backend

Go to Vercel dashboard → backend project → **Settings** → **Environment Variables**:

- Update `ALLOWED_ORIGINS` to include your frontend URL:
  ```
  https://servicesaas.vercel.app,https://servicesaas-api.vercel.app
  ```

Then redeploy the backend:
```bash
cd backend
vercel --prod
```

### 10.2 Update `VITE_API_URL` on frontend

If it isn't set yet, add it:
```bash
cd frontend
vercel env add VITE_API_URL production
# enter: https://servicesaas-api.vercel.app
vercel --prod
```

### 10.3 Test the connection

Open your frontend URL → go to `/superadmin` → log in with `admin` / `Yo2906`.

If you can see the dashboard, everything is connected.

---

## 11. Post-Deployment Checklist

- [ ] Super admin login works at `/superadmin`
- [ ] Can create a new business from the super admin panel
- [ ] Public store page loads at `/store?business=1`
- [ ] "Reserve Now" button opens the phone dialer
- [ ] Work hours display correctly
- [ ] Admin can upload a logo and hero image (goes to Supabase Storage)
- [ ] Admin can create services with cover images
- [ ] Feedback form submits successfully
- [ ] Change the default super admin password (currently `Yo2906`)
  - In Supabase SQL Editor: `UPDATE super_admins SET password_hash = 'YOUR_NEW_PASSWORD' WHERE username = 'admin';`

---

## 12. Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` is correct in Vercel env vars
- Ensure the password in the connection string doesn't have special characters that need URL-encoding (use `%40` for `@`, etc.)
- In Supabase → Settings → Database → confirm SSL is enabled

### "CORS error" in browser
- Make sure `ALLOWED_ORIGINS` on the backend includes the exact frontend URL (no trailing slash)
- Redeploy backend after changing env vars

### "File upload fails"
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set correctly
- Check the storage bucket is named exactly `uploads` and is set to public
- Confirm the service_role policy allows INSERT

### "Routes return 404 on refresh"
- Make sure `frontend/vercel.json` with the rewrites rule is committed and deployed

### "Images not showing"
- Supabase Storage URLs are public: `https://[ref].supabase.co/storage/v1/object/public/uploads/[filename]`
- Check the bucket policy allows public SELECT

### Local dev still works (SQLite)
- Local development continues to use SQLite — no changes needed
- The PostgreSQL code only activates when `DATABASE_URL` is set
- To test PostgreSQL locally, just add `DATABASE_URL` to your local `backend/.env`

---

## Quick Reference

| Service | URL |
|---------|-----|
| Frontend (local) | http://localhost:5173 |
| Backend (local) | http://localhost:4000 |
| Supabase dashboard | https://supabase.com/dashboard |
| Vercel dashboard | https://vercel.com/dashboard |
| GitHub repo | https://github.com/YOUR-USERNAME/servicesaas |

| Credential | Value |
|------------|-------|
| Super Admin username | `admin` |
| Super Admin password | `Yo2906` ← **change this** |
| Business admin password | set per-business in super admin panel |

---

*Generated for ServiceSaaS — White-label service business platform*
