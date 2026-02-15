alter table public.projects
  add column if not exists customer_name text,
  add column if not exists business_name text;

