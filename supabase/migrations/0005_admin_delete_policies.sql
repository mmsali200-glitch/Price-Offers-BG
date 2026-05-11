-- ============================================================
-- BG Quotes — Admin DELETE policies
-- Allows admins to delete clients, quotes, and related data.
-- Safe to re-run.
-- ============================================================

-- quotes: admin can delete any quote
drop policy if exists "quotes_admin_delete" on public.quotes;
create policy "quotes_admin_delete"
  on public.quotes for delete
  using (owner_id = auth.uid() or public.current_role() = 'admin');

-- clients: admin can delete any client
drop policy if exists "clients_admin_delete" on public.clients;
create policy "clients_admin_delete"
  on public.clients for delete
  using (owner_id = auth.uid() or public.current_role() = 'admin');

-- quote_sections: cascade delete via quote ownership
drop policy if exists "sections_delete" on public.quote_sections;
create policy "sections_delete"
  on public.quote_sections for delete
  using (exists (
    select 1 from public.quotes q
    where q.id = quote_sections.quote_id
    and (q.owner_id = auth.uid() or public.current_role() = 'admin')
  ));

-- quote_events: cascade delete
drop policy if exists "events_delete" on public.quote_events;
create policy "events_delete"
  on public.quote_events for delete
  using (exists (
    select 1 from public.quotes q
    where q.id = quote_events.quote_id
    and (q.owner_id = auth.uid() or public.current_role() = 'admin')
  ));

-- quote_versions: cascade delete
drop policy if exists "versions_delete" on public.quote_versions;
create policy "versions_delete"
  on public.quote_versions for delete
  using (exists (
    select 1 from public.quotes q
    where q.id = quote_versions.quote_id
    and (q.owner_id = auth.uid() or public.current_role() = 'admin')
  ));

-- signatures: cascade delete
drop policy if exists "signatures_delete" on public.signatures;
create policy "signatures_delete"
  on public.signatures for delete
  using (exists (
    select 1 from public.quotes q
    where q.id = signatures.quote_id
    and (q.owner_id = auth.uid() or public.current_role() = 'admin')
  ));

-- magic_links: cascade delete
drop policy if exists "magic_links_delete" on public.magic_links;
create policy "magic_links_delete"
  on public.magic_links for delete
  using (exists (
    select 1 from public.quotes q
    where q.id = magic_links.quote_id
    and (q.owner_id = auth.uid() or public.current_role() = 'admin')
  ));
