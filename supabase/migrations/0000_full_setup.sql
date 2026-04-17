-- ╔══════════════════════════════════════════════════════════════╗
-- ║  BG QUOTES — CONSOLIDATED SCHEMA SETUP                       ║
-- ║  One-file script that installs the entire database.          ║
-- ║  Safe to run on a fresh OR already-migrated project.         ║
-- ║  Includes: 0001 initial schema + 0002 roles + 0003 client.   ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── Extensions ───────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Enums (guarded) ──────────────────────────────────────
do $$ begin
  create type quote_status as enum (
    'draft', 'sent', 'opened', 'accepted', 'rejected', 'expired'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type quote_event_kind as enum (
    'created', 'updated', 'sent', 'opened', 'downloaded',
    'accepted', 'rejected', 'signed', 'regenerated'
  );
exception when duplicate_object then null;
end $$;

-- ══════════════════════════════════════════════════════════
-- 1. TABLES
-- ══════════════════════════════════════════════════════════

-- profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null default 'sales',
  phone       text,
  email       text,
  created_at  timestamptz not null default now()
);

-- clients ─────────────────────────────────────────────────
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete restrict,
  name_ar       text not null,
  name_en       text,
  client_code   text,
  sector        text,
  employee_size text,
  contact_name  text,
  contact_phone text,
  contact_email text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_clients_owner on public.clients(owner_id);

-- clients — extended profile fields (from migration 0003)
alter table public.clients add column if not exists country                text;
alter table public.clients add column if not exists governorate            text;
alter table public.clients add column if not exists city                   text;
alter table public.clients add column if not exists address                text;
alter table public.clients add column if not exists business_activity      text;
alter table public.clients add column if not exists commission_pct         numeric(5,2) default 0;
alter table public.clients add column if not exists communication_language text default 'ar';
alter table public.clients add column if not exists website                text;
alter table public.clients add column if not exists tax_number             text;
alter table public.clients add column if not exists crn                    text;

-- quotes ──────────────────────────────────────────────────
create table if not exists public.quotes (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles(id) on delete restrict,
  client_id         uuid references public.clients(id) on delete set null,
  ref               text not null unique,
  title             text,
  status            quote_status not null default 'draft',
  currency          text not null default 'KWD',
  exchange_rate     numeric(10,4) default 1,
  odoo_version      text,
  validity_days     int default 30,
  issued_at         date,
  total_development numeric(14,2) default 0,
  total_monthly     numeric(14,2) default 0,
  license_monthly   numeric(14,2) default 0,
  support_monthly   numeric(14,2) default 0,
  user_count        int default 10,
  generated_html    text,
  generated_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_quotes_owner on public.quotes(owner_id);
create index if not exists idx_quotes_client on public.quotes(client_id);
create index if not exists idx_quotes_status on public.quotes(status);

-- quotes — language column (from migration 0003)
alter table public.quotes add column if not exists quote_language text default 'ar';

-- quote_sections ──────────────────────────────────────────
create table if not exists public.quote_sections (
  quote_id   uuid primary key references public.quotes(id) on delete cascade,
  payload    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- quote_versions ──────────────────────────────────────────
create table if not exists public.quote_versions (
  id         uuid primary key default gen_random_uuid(),
  quote_id   uuid not null references public.quotes(id) on delete cascade,
  version    int not null,
  snapshot   jsonb not null,
  note       text,
  created_at timestamptz not null default now(),
  unique (quote_id, version)
);

-- quote_events ────────────────────────────────────────────
create table if not exists public.quote_events (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null references public.quotes(id) on delete cascade,
  kind        quote_event_kind not null,
  actor_type  text not null default 'user',
  actor_id    uuid,
  metadata    jsonb default '{}'::jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_events_quote on public.quote_events(quote_id, created_at desc);

-- signatures ──────────────────────────────────────────────
create table if not exists public.signatures (
  id            uuid primary key default gen_random_uuid(),
  quote_id      uuid not null references public.quotes(id) on delete cascade,
  signer_name   text not null,
  signer_email  text,
  signer_phone  text,
  signature_b64 text not null,
  ip_address    inet,
  user_agent    text,
  signed_at     timestamptz not null default now(),
  unique (quote_id)
);

-- magic_links ─────────────────────────────────────────────
create table if not exists public.magic_links (
  token      text primary key,
  quote_id   uuid not null references public.quotes(id) on delete cascade,
  expires_at timestamptz not null,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_magic_quote on public.magic_links(quote_id);

-- templates ───────────────────────────────────────────────
create table if not exists public.templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sector      text not null,
  description text,
  payload     jsonb not null,
  is_public   boolean not null default true,
  owner_id    uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════
-- 2. CHECK CONSTRAINTS
-- ══════════════════════════════════════════════════════════

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add  constraint profiles_role_check
  check (role in ('sales', 'manager', 'admin'));

alter table public.clients drop constraint if exists clients_comm_lang_check;
alter table public.clients add  constraint clients_comm_lang_check
  check (communication_language in ('ar', 'en'));

alter table public.quotes drop constraint if exists quotes_language_check;
alter table public.quotes add  constraint quotes_language_check
  check (quote_language in ('ar', 'en'));

-- ══════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════

alter table public.profiles        enable row level security;
alter table public.clients         enable row level security;
alter table public.quotes          enable row level security;
alter table public.quote_sections  enable row level security;
alter table public.quote_versions  enable row level security;
alter table public.quote_events    enable row level security;
alter table public.signatures      enable row level security;
alter table public.magic_links     enable row level security;
alter table public.templates       enable row level security;

-- ── Role helper function ─────────────────────────────────
create or replace function public.current_role() returns text
  language sql security definer stable
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- ══════════════════════════════════════════════════════════
-- 4. POLICIES (drop-and-recreate for idempotency)
-- ══════════════════════════════════════════════════════════

-- profiles
drop policy if exists "profiles_self_read"     on public.profiles;
drop policy if exists "profiles_self_update"   on public.profiles;
drop policy if exists "profiles_admin_read"    on public.profiles;
drop policy if exists "profiles_admin_update"  on public.profiles;

create policy "profiles_admin_read"
  on public.profiles for select
  using (id = auth.uid() or public.current_role() = 'admin');

create policy "profiles_admin_update"
  on public.profiles for update
  using (id = auth.uid() or public.current_role() = 'admin');

-- clients
drop policy if exists "clients_owner_full"     on public.clients;
drop policy if exists "clients_manager_read"   on public.clients;

create policy "clients_owner_full"
  on public.clients for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "clients_manager_read"
  on public.clients for select
  using (owner_id = auth.uid() or public.current_role() in ('manager','admin'));

-- quotes
drop policy if exists "quotes_owner_full"      on public.quotes;
drop policy if exists "quotes_manager_read"    on public.quotes;
drop policy if exists "quotes_admin_update"    on public.quotes;

create policy "quotes_owner_full"
  on public.quotes for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "quotes_manager_read"
  on public.quotes for select
  using (owner_id = auth.uid() or public.current_role() in ('manager','admin'));

create policy "quotes_admin_update"
  on public.quotes for update
  using (owner_id = auth.uid() or public.current_role() = 'admin');

-- quote_sections
drop policy if exists "quote_sections_via_quote" on public.quote_sections;
drop policy if exists "sections_manager_read"    on public.quote_sections;

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

create policy "sections_manager_read"
  on public.quote_sections for select
  using (exists (
    select 1 from public.quotes q
    where q.id = quote_sections.quote_id
    and (q.owner_id = auth.uid() or public.current_role() in ('manager','admin'))
  ));

-- quote_versions
drop policy if exists "quote_versions_via_quote" on public.quote_versions;

create policy "quote_versions_via_quote"
  on public.quote_versions for all
  using (exists (
    select 1 from public.quotes q
    where q.id = quote_versions.quote_id and q.owner_id = auth.uid()
  ));

-- quote_events
drop policy if exists "events_owner_read"    on public.quote_events;
drop policy if exists "events_manager_read"  on public.quote_events;

create policy "events_manager_read"
  on public.quote_events for select
  using (exists (
    select 1 from public.quotes q
    where q.id = quote_events.quote_id
    and (q.owner_id = auth.uid() or public.current_role() in ('manager','admin'))
  ));

-- quote_events (INSERT — needed for createQuote + updateStatus)
drop policy if exists "events_owner_insert" on public.quote_events;
create policy "events_owner_insert"
  on public.quote_events for insert
  with check (exists (
    select 1 from public.quotes q
    where q.id = quote_events.quote_id
    and (q.owner_id = auth.uid() or public.current_role() in ('manager','admin'))
  ));

-- quote_versions (INSERT — needed for snapshot on send/regenerate)
drop policy if exists "versions_owner_insert" on public.quote_versions;
create policy "versions_owner_insert"
  on public.quote_versions for insert
  with check (exists (
    select 1 from public.quotes q
    where q.id = quote_versions.quote_id and q.owner_id = auth.uid()
  ));

-- signatures
drop policy if exists "signatures_owner_read" on public.signatures;
drop policy if exists "signatures_owner_insert" on public.signatures;

create policy "signatures_owner_read"
  on public.signatures for select
  using (exists (
    select 1 from public.quotes q
    where q.id = signatures.quote_id and q.owner_id = auth.uid()
  ));

create policy "signatures_owner_insert"
  on public.signatures for insert
  with check (exists (
    select 1 from public.quotes q
    where q.id = signatures.quote_id and q.owner_id = auth.uid()
  ));

-- templates
drop policy if exists "templates_public_read" on public.templates;
drop policy if exists "templates_owner_write" on public.templates;

create policy "templates_public_read"
  on public.templates for select
  using (is_public = true or owner_id = auth.uid());

create policy "templates_owner_write"
  on public.templates for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ══════════════════════════════════════════════════════════
-- 5. TRIGGERS & FUNCTIONS
-- ══════════════════════════════════════════════════════════

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger tg_clients_updated
  before update on public.clients
  for each row execute function public.set_updated_at();

create or replace trigger tg_quotes_updated
  before update on public.quotes
  for each row execute function public.set_updated_at();

create or replace trigger tg_sections_updated
  before update on public.quote_sections
  for each row execute function public.set_updated_at();

-- Auto-create a profile when a new auth.users row appears.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'sales'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger tg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ══════════════════════════════════════════════════════════
-- ✅ Done. All tables / policies / triggers are in place.
-- Next (run once if you want to become admin):
--   update public.profiles set role = 'admin'
--   where email = 'YOUR_EMAIL@example.com';
-- ══════════════════════════════════════════════════════════
