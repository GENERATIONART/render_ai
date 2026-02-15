-- Admin-managed site content (portfolio/gallery + homepage copy)

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Only admins can view/manage the admins table.
do $$
begin
  create policy "Admins can manage admins"
  on public.admins
  for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
exception
  when duplicate_object then null;
end $$;

create table if not exists public.site_copy (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_copy enable row level security;

-- Public can read site copy
do $$
begin
  create policy "Public read site copy"
  on public.site_copy
  for select
  using (true);
exception
  when duplicate_object then null;
end $$;

-- Admins can write site copy
do $$
begin
  create policy "Admins write site copy"
  on public.site_copy
  for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
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

do $$
begin
  create policy "Admins manage portfolio items"
  on public.portfolio_items
  for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
exception
  when duplicate_object then null;
end $$;

-- Storage bucket + policies for site media (run once)
-- This assumes you want a public-readable bucket for gallery images.
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- Public read access for site media
do $$
begin
  create policy "Public read site media"
  on storage.objects
  for select
  using (bucket_id = 'site-media');
exception
  when duplicate_object then null;
end $$;

-- Admins can upload/update/delete site media
do $$
begin
  create policy "Admins write site media"
  on storage.objects
  for all
  using (bucket_id = 'site-media' and exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (bucket_id = 'site-media' and exists (select 1 from public.admins a where a.user_id = auth.uid()));
exception
  when duplicate_object then null;
end $$;
