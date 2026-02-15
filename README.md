# Brendan (Business-grade checkout + uploads)

This app is a Vite + React frontend with a small Node API for:
- creating a “project” record
- uploading project files to Supabase Storage (via signed upload URLs)
- creating a Stripe Checkout Session (with automatic tax)
- processing Stripe webhooks to mark projects as paid

## Setup

1) Install dependencies

```bash
npm install
```

2) Create a `.env.local` (frontend) and `.env` (API) from `.env.example`.

Minimum required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (defaults to `project-files`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_URL` (e.g. `http://localhost:5173` in dev, your domain in prod)
- email notifications: `OWNER_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM`

3) Create DB tables in Supabase

Preferred (Prisma):

- Set `DATABASE_URL` to your Supabase Postgres connection string (Project Settings → Database → Connection string).
- Run `npm run prisma:migrate:deploy` to apply `prisma/migrations/*`.
- This creates the default upload bucket `project-files`; if you changed `SUPABASE_STORAGE_BUCKET`, create a bucket with that id in Supabase Storage too.
- This also creates `site_copy` + `portfolio_items` (used by `/admin`) and the public `site-media` bucket.

If you already created tables manually in Supabase, either:
- start from a fresh Supabase project, or
- baseline the existing DB by marking the migration as applied:
  - `npx prisma migrate resolve --applied 20260215140000_init`

Legacy option (Supabase SQL editor): run the SQL in `supabase/migrations/*.sql`.

4) Enable Stripe Tax

In Stripe Dashboard, enable Stripe Tax and add the tax registrations you need. This project uses Stripe Checkout automatic tax.

## Local dev

Start both frontend + API:

```bash
npm run dev:all
```

Frontend: `http://localhost:5173`  
API: `http://localhost:5174`

## Stripe webhooks (dev)

Point Stripe webhooks to:
- `POST /api/webhooks/stripe` on your API host

In dev, use Stripe CLI to forward webhooks to `localhost:5174`.

## Owner emails

Owner notification emails are sent (best-effort) on:
- project created (`POST /api/projects`)
- files recorded (`POST /api/projects/:projectId/files`)
- successful payment (Stripe webhook)

Configure:
- `OWNER_EMAIL` (destination)
- `RESEND_API_KEY`
- `RESEND_FROM` (must be a verified sender/domain in Resend)

## Admin site

Visit:
- `/admin`

Content is stored in Supabase tables:
- `portfolio_items` (gallery + portfolio)
- `site_copy` (homepage copy)

Access is restricted by the API server (no Supabase Auth):
- Set `ADMIN_EMAIL=brendan@brendantadler.com`
- Set `ADMIN_PASSWORD` to a strong password
- Set `ADMIN_SESSION_SECRET` to a long random string

Then sign in at `/admin`.

## Deploy to Vercel (frontend + API)

This repo includes a single Vercel Serverless Function at `api/[...path].js` (Hobby-plan friendly), so `/api/*` works on your Vercel domain (no separate server to deploy).

In Vercel Project Settings → Environment Variables, set (Functions/runtime):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_TAX_CODE` (optional)
- `APP_URL` (set to your Vercel domain, e.g. `https://your-site.vercel.app`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
- Email notifications (optional): `OWNER_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM`

For the browser (Build-time env vars):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
