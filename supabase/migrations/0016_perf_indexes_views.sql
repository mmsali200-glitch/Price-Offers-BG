-- ============================================================
-- BG Quotes — Performance: indexes, aggregated views, denormalized
-- module ID array on quote_sections.
-- ============================================================

-- ---- Index: speed up "list quotes ordered by updated_at desc" per owner.
create index if not exists idx_quotes_owner_updated
  on public.quotes (owner_id, updated_at desc);

-- ---- Denormalized array of selected module IDs.
-- The dashboard "top modules" query used to fetch every quote's full
-- JSONB payload just to inspect which modules were marked selected.
-- We now mirror the selection into a text[] column updated on every
-- save (see lib/actions/quotes.ts saveQuote).
alter table public.quote_sections
  add column if not exists selected_module_ids text[] not null default '{}';

-- Backfill existing rows.
update public.quote_sections
   set selected_module_ids = coalesce(
       (
         select array_agg(key)
         from   jsonb_each(payload -> 'modules') as e(key, value)
         where  (value ->> 'selected')::boolean is true
       ),
       '{}'
   )
 where selected_module_ids = '{}'
   and payload ? 'modules';

-- ---- View: aggregated quote stats per client.
-- Replaces the JS-side reduce in lib/actions/clients.ts listClients.
create or replace view public.client_quote_stats as
select
  q.client_id,
  q.owner_id,
  count(*)::int               as quote_count,
  coalesce(sum(q.total_development), 0)::numeric as total_value,
  max(q.updated_at)           as last_quote_date
from   public.quotes q
where  q.client_id is not null
group by q.client_id, q.owner_id;

grant select on public.client_quote_stats to authenticated;

-- ---- View: quote count per user (admin user table).
-- Replaces full quote scan + JS counter in lib/actions/users.ts listUsers.
create or replace view public.user_quote_counts as
select
  owner_id,
  count(*)::int as quote_count
from   public.quotes
group by owner_id;

grant select on public.user_quote_counts to authenticated;
