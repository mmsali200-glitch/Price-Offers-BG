-- ============================================================
-- BG Quotes — Fix: add INSERT policies for events + versions
-- Safe to re-run (drop-if-exists first).
-- ============================================================

-- quote_events: allow owners to INSERT events for their own quotes
drop policy if exists "events_owner_insert" on public.quote_events;
create policy "events_owner_insert"
  on public.quote_events for insert
  with check (exists (
    select 1 from public.quotes q
    where q.id = quote_events.quote_id
    and (q.owner_id = auth.uid() or public.current_role() in ('manager', 'admin'))
  ));

-- quote_versions: allow owners to INSERT versions for their own quotes
drop policy if exists "versions_owner_insert" on public.quote_versions;
create policy "versions_owner_insert"
  on public.quote_versions for insert
  with check (exists (
    select 1 from public.quotes q
    where q.id = quote_versions.quote_id and q.owner_id = auth.uid()
  ));

-- signatures: allow INSERT via owner
drop policy if exists "signatures_owner_insert" on public.signatures;
create policy "signatures_owner_insert"
  on public.signatures for insert
  with check (exists (
    select 1 from public.quotes q
    where q.id = signatures.quote_id and q.owner_id = auth.uid()
  ));
