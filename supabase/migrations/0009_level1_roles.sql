-- ============================================================
-- BG Quotes — Level 1 Role Improvements
-- Manager: approve quotes, edit clients, delete quotes
-- Sales: request approval
-- Admin: activity log, export
-- ============================================================

-- ── Add approval fields to quotes ──────────────────────────
alter table public.quotes
  add column if not exists requires_approval boolean not null default false,
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists approved_at timestamptz,
  add column if not exists approval_note text;

-- ── Activity log table ─────────────────────────────────────
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id),
  actor_name  text,
  actor_role  text,
  action      text not null,
  entity_type text not null,
  entity_id   text,
  entity_name text,
  details     jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_activity_log_created on public.activity_log(created_at desc);
create index if not exists idx_activity_log_actor on public.activity_log(actor_id);

alter table public.activity_log enable row level security;

drop policy if exists "activity_log_read" on public.activity_log;
create policy "activity_log_read" on public.activity_log for select
  using (public.current_role() in ('manager', 'admin'));

drop policy if exists "activity_log_insert" on public.activity_log;
create policy "activity_log_insert" on public.activity_log for insert
  with check (true);

-- ── Manager: can now edit clients ──────────────────────────
drop policy if exists "clients_manager_update" on public.clients;
create policy "clients_manager_update"
  on public.clients for update
  using (
    owner_id = auth.uid()
    or public.current_role() in ('manager', 'admin')
  )
  with check (
    owner_id = auth.uid()
    or public.current_role() in ('manager', 'admin')
  );

-- ── Manager: can now delete quotes ─────────────────────────
drop policy if exists "quotes_admin_delete" on public.quotes;
create policy "quotes_manager_delete"
  on public.quotes for delete
  using (
    owner_id = auth.uid()
    or public.current_role() in ('manager', 'admin')
  );

-- ── Manager: can delete clients ────────────────────────────
drop policy if exists "clients_admin_delete" on public.clients;
create policy "clients_manager_delete"
  on public.clients for delete
  using (
    owner_id = auth.uid()
    or public.current_role() in ('manager', 'admin')
  );
