-- ============================================================
-- BG Quotes — Initial Schema
-- Tables: profiles, clients, quotes, quote_sections,
--         quote_versions, quote_events, signatures,
--         magic_links, templates
-- ============================================================

-- ── Extensions ─────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Enums ──────────────────────────────────────────────────
create type quote_status as enum (
  'draft', 'sent', 'opened', 'accepted', 'rejected', 'expired'
);

create type quote_event_kind as enum (
  'created', 'updated', 'sent', 'opened', 'downloaded',
  'accepted', 'rejected', 'signed', 'regenerated'
);

-- ── profiles ───────────────────────────────────────────────
-- One row per Business Gate team member, linked to auth.users
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null default 'sales',  -- sales | manager | admin
  phone       text,
  email       text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id);

-- ── clients ────────────────────────────────────────────────
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete restrict,
  name_ar       text not null,
  name_en       text,
  client_code   text,             -- 3-letter code for quote ref
  sector        text,
  employee_size text,
  contact_name  text,
  contact_phone text,
  contact_email text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_clients_owner on public.clients(owner_id);

alter table public.clients enable row level security;

create policy "clients_owner_full"
  on public.clients for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ── quotes ─────────────────────────────────────────────────
create table public.quotes (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles(id) on delete restrict,
  client_id         uuid references public.clients(id) on delete set null,
  ref               text not null unique,      -- BG-2026-NOR-001
  title             text,
  status            quote_status not null default 'draft',
  currency          text not null default 'KWD',
  exchange_rate     numeric(10,4) default 1,
  odoo_version      text,                      -- "16" | "17" | "18" | "19"
  validity_days     int default 30,
  issued_at         date,
  total_development numeric(14,2) default 0,
  total_monthly     numeric(14,2) default 0,
  license_monthly   numeric(14,2) default 0,
  support_monthly   numeric(14,2) default 0,
  user_count        int default 10,
  generated_html    text,                      -- Claude-generated HTML
  generated_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_quotes_owner on public.quotes(owner_id);
create index idx_quotes_client on public.quotes(client_id);
create index idx_quotes_status on public.quotes(status);

alter table public.quotes enable row level security;

create policy "quotes_owner_full"
  on public.quotes for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ── quote_sections ─────────────────────────────────────────
-- Flexible JSONB payload for the Builder state:
-- { modules: [...], bg_apps: [...], options: [...],
--   phases: [...], schedule: [...], license: {...},
--   support: {...}, contacts: [...], meeting_notes: [...],
--   project_desc: '', workflows: '', extra_notes: '' }
create table public.quote_sections (
  quote_id   uuid primary key references public.quotes(id) on delete cascade,
  payload    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.quote_sections enable row level security;

create policy "quote_sections_via_quote"
  on public.quote_sections for all
  using (exists (
    select 1 from public.quotes q
    where q.id = quote_sections.quote_id and q.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.quotes q
    where q.id = quote_sections.quote_id and q.owner_id = auth.uid()
  ));

-- ── quote_versions ─────────────────────────────────────────
-- Snapshots of quote+sections at key moments (sent, regenerated, etc.)
create table public.quote_versions (
  id         uuid primary key default gen_random_uuid(),
  quote_id   uuid not null references public.quotes(id) on delete cascade,
  version    int not null,
  snapshot   jsonb not null,
  note       text,
  created_at timestamptz not null default now(),
  unique (quote_id, version)
);

alter table public.quote_versions enable row level security;

create policy "quote_versions_via_quote"
  on public.quote_versions for all
  using (exists (
    select 1 from public.quotes q
    where q.id = quote_versions.quote_id and q.owner_id = auth.uid()
  ));

-- ── quote_events ───────────────────────────────────────────
create table public.quote_events (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null references public.quotes(id) on delete cascade,
  kind        quote_event_kind not null,
  actor_type  text not null default 'user',   -- user | client | system
  actor_id    uuid,
  metadata    jsonb default '{}'::jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index idx_events_quote on public.quote_events(quote_id, created_at desc);

alter table public.quote_events enable row level security;

create policy "events_owner_read"
  on public.quote_events for select
  using (exists (
    select 1 from public.quotes q
    where q.id = quote_events.quote_id and q.owner_id = auth.uid()
  ));

-- ── signatures ─────────────────────────────────────────────
create table public.signatures (
  id            uuid primary key default gen_random_uuid(),
  quote_id      uuid not null references public.quotes(id) on delete cascade,
  signer_name   text not null,
  signer_email  text,
  signer_phone  text,
  signature_b64 text not null,                 -- PNG data URL from canvas
  ip_address    inet,
  user_agent    text,
  signed_at     timestamptz not null default now(),
  unique (quote_id)
);

alter table public.signatures enable row level security;

create policy "signatures_owner_read"
  on public.signatures for select
  using (exists (
    select 1 from public.quotes q
    where q.id = signatures.quote_id and q.owner_id = auth.uid()
  ));

-- ── magic_links ────────────────────────────────────────────
-- Tokenized links for client portal access (no auth required)
create table public.magic_links (
  token      text primary key,               -- 32-char random
  quote_id   uuid not null references public.quotes(id) on delete cascade,
  expires_at timestamptz not null,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_magic_quote on public.magic_links(quote_id);

-- Magic links are read/written only via service_role (admin client)
alter table public.magic_links enable row level security;

-- ── templates ──────────────────────────────────────────────
-- Sector-specific starter templates
create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sector      text not null,
  description text,
  payload     jsonb not null,
  is_public   boolean not null default true,
  owner_id    uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.templates enable row level security;

create policy "templates_public_read"
  on public.templates for select
  using (is_public = true or owner_id = auth.uid());

create policy "templates_owner_write"
  on public.templates for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ── updated_at trigger helper ──────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tg_clients_updated
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger tg_quotes_updated
  before update on public.quotes
  for each row execute function public.set_updated_at();

create trigger tg_sections_updated
  before update on public.quote_sections
  for each row execute function public.set_updated_at();

-- ── Auto-create profile when user signs up ─────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'sales'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger tg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
