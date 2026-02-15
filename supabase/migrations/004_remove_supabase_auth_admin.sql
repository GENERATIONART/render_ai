-- Remove reliance on Supabase Auth for admin management.
-- Admin access is now enforced at the API layer (ADMIN_EMAIL/ADMIN_PASSWORD).

drop policy if exists "Admins can manage admins" on public.admins;
drop table if exists public.admins;

-- Prevent authenticated users from writing content directly; API uses service role.
drop policy if exists "Admins write site copy" on public.site_copy;
drop policy if exists "Admins manage portfolio items" on public.portfolio_items;
drop policy if exists "Admins write site media" on storage.objects;

