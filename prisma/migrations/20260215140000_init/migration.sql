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

-- Public site copy (readable by anon key via RLS policy)
create table if not exists public.site_copy (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_copy enable row level security;

do $$
begin
  create policy "Public read site copy"
  on public.site_copy
  for select
  using (true);
exception
  when duplicate_object then null;
end $$;

-- Portfolio items (public can read published ones)
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published boolean not null default true,
  sort_order integer not null default 0,
  slug text not null unique,
  title text not null,
  tag text,
  location text,
  render_time text,
  image_url text,
  brief text,
  scope text,
  deliverables jsonb not null default '[]'::jsonb,
  tools jsonb not null default '[]'::jsonb,
  timeline jsonb not null default '[]'::jsonb
);

alter table public.portfolio_items enable row level security;

do $$
begin
  create policy "Public read published portfolio items"
  on public.portfolio_items
  for select
  using (published = true);
exception
  when duplicate_object then null;
end $$;

-- Storage bucket for admin-managed site media (public readable).
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- Default bucket for customer project uploads (private).
-- If you set SUPABASE_STORAGE_BUCKET to something else, create that bucket too.
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

do $$
begin
  create policy "Public read site media"
  on storage.objects
  for select
  using (bucket_id = 'site-media');
exception
  when duplicate_object then null;
end $$;
