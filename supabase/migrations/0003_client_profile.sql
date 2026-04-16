-- ============================================================
-- BG Quotes — Client Profile Enrichment (migration 0003)
-- Extends public.clients with the full set of fields that sales
-- capture when creating a new quote: location, business, tax,
-- commission, and communication language.
-- Safe to re-run.
-- ============================================================

alter table public.clients
  add column if not exists country                text,
  add column if not exists governorate            text,
  add column if not exists city                   text,
  add column if not exists address                text,
  add column if not exists business_activity      text,
  add column if not exists commission_pct         numeric(5,2) default 0,
  add column if not exists communication_language text default 'ar',
  add column if not exists website                text,
  add column if not exists tax_number             text,
  add column if not exists crn                    text; -- commercial registration number

-- Constrain communication_language to ar / en.
alter table public.clients
  drop constraint if exists clients_comm_lang_check;

alter table public.clients
  add constraint clients_comm_lang_check
  check (communication_language in ('ar', 'en'));

-- Also persist the quote language on the quotes row itself so dashboards
-- can filter by language without parsing the JSONB payload every time.
alter table public.quotes
  add column if not exists quote_language text default 'ar';

alter table public.quotes
  drop constraint if exists quotes_language_check;

alter table public.quotes
  add constraint quotes_language_check
  check (quote_language in ('ar', 'en'));
