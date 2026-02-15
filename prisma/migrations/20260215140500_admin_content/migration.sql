-- Admin-managed site content (portfolio + copy) with public read access.

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

do $$
begin
  create policy "Public read site media"
  on storage.objects
  for select
  using (bucket_id = 'site-media');
exception
  when duplicate_object then null;
end $$;

