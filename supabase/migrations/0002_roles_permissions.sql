-- ============================================================
-- BG Quotes — Roles & Permissions
-- Adds manager/admin roles with org-wide access to quotes.
-- Keep profiles.role in sync with the enum below.
-- ============================================================

-- Use the existing text column; add a check for valid values.
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('sales', 'manager', 'admin'));

-- Helper: returns the caller's role (null if no profile).
create or replace function public.current_role() returns text
language sql security definer stable
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- ── Managers + Admins: read-all on quotes ─────────────────
drop policy if exists "quotes_manager_read" on public.quotes;
create policy "quotes_manager_read"
  on public.quotes for select
  using (
    owner_id = auth.uid()
    or public.current_role() in ('manager', 'admin')
  );

-- Admins can update any quote's status/meta.
drop policy if exists "quotes_admin_update" on public.quotes;
create policy "quotes_admin_update"
  on public.quotes for update
  using (
    owner_id = auth.uid()
    or public.current_role() = 'admin'
  );

-- ── Managers + Admins: read-all on sections ──────────────
drop policy if exists "sections_manager_read" on public.quote_sections;
create policy "sections_manager_read"
  on public.quote_sections for select
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_sections.quote_id
      and (q.owner_id = auth.uid() or public.current_role() in ('manager', 'admin'))
    )
  );

-- ── Managers + Admins: read all events ───────────────────
drop policy if exists "events_manager_read" on public.quote_events;
create policy "events_manager_read"
  on public.quote_events for select
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_events.quote_id
      and (q.owner_id = auth.uid() or public.current_role() in ('manager', 'admin'))
    )
  );

-- ── Managers + Admins: read all clients ──────────────────
drop policy if exists "clients_manager_read" on public.clients;
create policy "clients_manager_read"
  on public.clients for select
  using (
    owner_id = auth.uid()
    or public.current_role() in ('manager', 'admin')
  );

-- ── Admin: manage profiles (read all + update role) ──────
drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.current_role() = 'admin'
  );

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update
  using (
    id = auth.uid()
    or public.current_role() = 'admin'
  );

-- ── Make the first user an admin automatically ───────────
-- If you want a specific account to be admin, run this once:
--   update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';
