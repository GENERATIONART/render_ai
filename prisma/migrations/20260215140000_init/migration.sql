-- Baseline schema for this project (Supabase Postgres).
-- Includes the public tables, RLS enablement, and public read policies used by the site.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'created',
  email text not null,
  customer_name text,
  business_name text,
  service_name text not null,
  project_info text,
  amount_cents integer,
  currency text not null default 'usd',
  checkout_session_id text,
  payment_status text not null default 'unpaid'
);

create index if not exists projects_created_at_idx on public.projects (created_at desc);
create index if not exists projects_email_idx on public.projects (email);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  project_id uuid not null references public.projects(id) on delete cascade,
  bucket text not null,
  path text not null,
  original_name text not null,
  content_type text,
  size_bytes bigint
);

create index if not exists project_files_project_id_idx on public.project_files (project_id);

create table if not exists public.stripe_webhook_events (
  id text primary key,
  created_at timestamptz not null default now()
);

-- Lock tables behind service role by default (RLS enabled; no policies for write paths).
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- Default bucket for customer project uploads (private).
-- If you set SUPABASE_STORAGE_BUCKET to something else, create that bucket too.
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;
