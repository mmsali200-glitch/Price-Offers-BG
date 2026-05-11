-- ============================================================
-- BG Quotes — Client Survey System
-- Stores survey invitations and responses
-- ============================================================

create table if not exists public.surveys (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid references public.quotes(id),
  client_id   uuid references public.clients(id),
  token       text unique not null default encode(gen_random_bytes(24), 'hex'),
  company_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  industry    text,
  status      text not null default 'pending' check (status in ('pending', 'in_progress', 'submitted')),
  progress    int not null default 0,
  responses   jsonb not null default '{}'::jsonb,
  notes       jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_surveys_token on public.surveys(token);
create index if not exists idx_surveys_status on public.surveys(status);

alter table public.surveys enable row level security;

drop policy if exists "surveys_read" on public.surveys;
create policy "surveys_read" on public.surveys for select
  using (
    created_by = auth.uid()
    or public.current_role() in ('manager', 'admin')
  );

drop policy if exists "surveys_write" on public.surveys;
create policy "surveys_write" on public.surveys for all
  using (
    created_by = auth.uid()
    or public.current_role() in ('manager', 'admin')
  )
  with check (
    created_by = auth.uid()
    or public.current_role() in ('manager', 'admin')
  );

-- Public access for clients filling via token (no auth needed)
drop policy if exists "surveys_public_fill" on public.surveys;
create policy "surveys_public_fill" on public.surveys for update
  using (true)
  with check (true);
