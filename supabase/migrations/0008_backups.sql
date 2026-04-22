-- ============================================================
-- BG Quotes — Backup System
-- Stores backup metadata. Actual data is stored as JSONB.
-- ============================================================

create table if not exists public.backups (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'manual' check (type in ('manual', 'auto')),
  records     int not null default 0,
  size_bytes  bigint not null default 0,
  notes       text,
  data        jsonb not null default '{}'::jsonb,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

create index if not exists idx_backups_created on public.backups(created_at desc);

alter table public.backups enable row level security;

-- Only admins can manage backups
drop policy if exists "backups_admin" on public.backups;
create policy "backups_admin" on public.backups for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
