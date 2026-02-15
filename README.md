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

Run the SQL in `supabase/migrations/001_init.sql`.
If you already ran the initial migration earlier, also run `supabase/migrations/002_add_customer_fields.sql`.

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
