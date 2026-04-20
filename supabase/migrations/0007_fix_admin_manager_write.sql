-- ============================================================
-- BG Quotes — Fix admin/manager write access
-- Previous policies only allowed admins to UPDATE quotes, and
-- admin/manager couldn't write to quote_sections. This caused
-- "failed to save" errors when admin/manager tried to edit
-- quotes owned by other users.
-- ============================================================

-- ── Quotes: allow admin + manager to UPDATE any quote ──────
drop policy if exists "quotes_admin_update" on public.quotes;
create policy "quotes_admin_update"
  on public.quotes for update
  using (
    owner_id = auth.uid()
    or public.current_role() in ('manager', 'admin')
  )
  with check (
    owner_id = auth.uid()
    or public.current_role() in ('manager', 'admin')
  );

-- ── Quote sections: allow admin + manager + owner to write ──
drop policy if exists "sections_write" on public.quote_sections;
create policy "sections_write"
  on public.quote_sections for all
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_sections.quote_id
      and (q.owner_id = auth.uid() or public.current_role() in ('manager', 'admin'))
    )
  )
  with check (
    exists (
      select 1 from public.quotes q
      where q.id = quote_sections.quote_id
      and (q.owner_id = auth.uid() or public.current_role() in ('manager', 'admin'))
    )
  );

-- ── Quote events: allow admin + manager + owner to insert ──
drop policy if exists "events_write" on public.quote_events;
create policy "events_write"
  on public.quote_events for insert
  with check (
    exists (
      select 1 from public.quotes q
      where q.id = quote_events.quote_id
      and (q.owner_id = auth.uid() or public.current_role() in ('manager', 'admin'))
    )
  );
