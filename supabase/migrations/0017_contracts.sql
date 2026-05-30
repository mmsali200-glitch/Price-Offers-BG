-- ============================================================
-- BG Quotes — Contracts
-- Stores generated contracts linked to a quote. The HTML body is
-- generated from the quote state plus per-contract extras (PM info,
-- bank, jurisdiction, party overrides).
-- ============================================================

create table if not exists public.contracts (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references public.quotes(id) on delete cascade,
  client_id       uuid references public.clients(id) on delete set null,
  ref             text,
  contract_date   date not null default current_date,
  jurisdiction    text,
  pm_name         text,
  pm_phone        text,
  pm_email        text,
  -- Party + bank overrides. Stored as JSONB so the contract is a self-
  -- contained snapshot — re-rendering does not require the live quote.
  provider_data   jsonb,
  client_data     jsonb,
  bank_data       jsonb,
  -- Pre-rendered HTML for fast preview / download.
  html            text,
  status          text not null default 'draft'
                  check (status in ('draft','sent','signed','cancelled')),
  created_at      timestamptz not null default now(),
  created_by      uuid references public.profiles(id),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_contracts_quote on public.contracts(quote_id);
create index if not exists idx_contracts_client on public.contracts(client_id);
create index if not exists idx_contracts_created on public.contracts(created_at desc);

alter table public.contracts enable row level security;

-- Access mirrors quotes: admins/managers see everything, sales see their own
-- (rows whose quote they own).
drop policy if exists contracts_select on public.contracts;
create policy contracts_select on public.contracts for select
  using (
    public.current_role() in ('admin','manager')
    or exists (
      select 1 from public.quotes q
      where q.id = contracts.quote_id and q.owner_id = auth.uid()
    )
  );

drop policy if exists contracts_insert on public.contracts;
create policy contracts_insert on public.contracts for insert
  with check (
    public.current_role() in ('admin','manager')
    or exists (
      select 1 from public.quotes q
      where q.id = contracts.quote_id and q.owner_id = auth.uid()
    )
  );

drop policy if exists contracts_update on public.contracts;
create policy contracts_update on public.contracts for update
  using (
    public.current_role() in ('admin','manager')
    or exists (
      select 1 from public.quotes q
      where q.id = contracts.quote_id and q.owner_id = auth.uid()
    )
  );

drop policy if exists contracts_delete on public.contracts;
create policy contracts_delete on public.contracts for delete
  using (public.current_role() in ('admin','manager'));
