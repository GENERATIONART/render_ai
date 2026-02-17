-- Combined migration for Supabase SQL Editor (one paste).
-- Equivalent to Prisma migrations:
-- 20260215140000_init, 20260215140500_admin_content, 20260215141000_remove_supabase_auth_admin

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

alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.stripe_webhook_events enable row level security;

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
  images jsonb not null default '[]'::jsonb,
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

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
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

-- Remove reliance on Supabase Auth for admin management.
do $$
begin
  if to_regclass('public.admins') is not null then
    drop policy if exists "Admins can manage admins" on public.admins;
    drop table if exists public.admins;
  end if;
end $$;

drop policy if exists "Admins write site copy" on public.site_copy;
drop policy if exists "Admins manage portfolio items" on public.portfolio_items;
drop policy if exists "Admins write site media" on storage.objects;
