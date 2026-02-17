-- Add gallery images array for portfolio items.
alter table public.portfolio_items
  add column if not exists images jsonb not null default '[]'::jsonb;

