-- ============================================================
-- BG Quotes — Performance: client list aggregation + indexes
-- ============================================================
-- Replaces in-memory aggregation in listClients() with a single
-- SQL query, and adds composite indexes that support the join.

-- Composite index to speed up grouping quotes by (owner_id, client_id).
create index if not exists idx_quotes_owner_client
  on public.quotes(owner_id, client_id);

-- Covering index for client_id + updated_at (used for last_quote_date).
create index if not exists idx_quotes_client_updated
  on public.quotes(client_id, updated_at desc);

-- ── RPC: list_clients_with_stats ────────────────────────────
-- Returns each client visible to the caller along with aggregated
-- quote_count, total_value, and last_quote_date computed in SQL.
-- Honours role-based visibility:
--   • sales   → only own clients/quotes
--   • manager → all clients, all quotes
--   • admin   → all clients, all quotes
create or replace function public.list_clients_with_stats()
returns table (
  id              uuid,
  name_ar         text,
  name_en         text,
  sector          text,
  country         text,
  city            text,
  contact_name    text,
  contact_phone   text,
  contact_email   text,
  created_at      timestamptz,
  quote_count     bigint,
  total_value     numeric,
  last_quote_date timestamptz
)
language sql
security definer
stable
as $$
  with caller as (
    select
      auth.uid() as uid,
      coalesce(public.current_role(), 'sales') as role
  )
  select
    c.id,
    c.name_ar,
    c.name_en,
    c.sector,
    c.country,
    c.city,
    c.contact_name,
    c.contact_phone,
    c.contact_email,
    c.created_at,
    coalesce(q.quote_count, 0)::bigint     as quote_count,
    coalesce(q.total_value, 0)::numeric    as total_value,
    q.last_quote_date
  from public.clients c
  left join lateral (
    select
      count(*)                       as quote_count,
      sum(coalesce(total_development, 0)) as total_value,
      max(updated_at)                as last_quote_date
    from public.quotes qq
    where qq.client_id = c.id
      and (
        (select role from caller) in ('manager', 'admin')
        or qq.owner_id = (select uid from caller)
      )
  ) q on true
  where
    (select role from caller) in ('manager', 'admin')
    or c.owner_id = (select uid from caller)
  order by c.created_at desc;
$$;

grant execute on function public.list_clients_with_stats() to authenticated;
