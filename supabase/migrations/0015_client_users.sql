-- ============================================================
-- BG Quotes — Client User Accounts + Permission Stages
-- ============================================================
-- Each client gets a single login account. Access level controls
-- whether they can see the survey, the quote, both, or neither.

-- Extend profiles to distinguish internal staff from client logins.
alter table public.profiles
  add column if not exists user_type    text not null default 'internal',
  add column if not exists client_id    uuid references public.clients(id) on delete cascade,
  add column if not exists access_level text not null default 'none';

alter table public.profiles drop constraint if exists profiles_user_type_check;
alter table public.profiles add  constraint profiles_user_type_check
  check (user_type in ('internal', 'client'));

alter table public.profiles drop constraint if exists profiles_access_level_check;
alter table public.profiles add  constraint profiles_access_level_check
  check (access_level in ('none', 'survey', 'quote', 'both'));

-- Each client can have at most one user account.
create unique index if not exists idx_profiles_client_id
  on public.profiles(client_id)
  where client_id is not null;

-- ── handle_new_user: keep internal staff default ───────────
-- (the trigger now only sets defaults; client accounts get their
--  user_type/client_id/access_level overwritten by admin code).

-- ── RLS for clients reading their own survey ───────────────
drop policy if exists "surveys_client_read"  on public.surveys;
drop policy if exists "surveys_client_write" on public.surveys;

create policy "surveys_client_read"
  on public.surveys for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.user_type = 'client'
        and p.access_level in ('survey', 'both')
        and p.client_id = public.surveys.client_id
    )
  );

create policy "surveys_client_write"
  on public.surveys for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.user_type = 'client'
        and p.access_level in ('survey', 'both')
        and p.client_id = public.surveys.client_id
    )
  );

-- ── RLS for clients reading their own quotes ───────────────
drop policy if exists "quotes_client_read" on public.quotes;

create policy "quotes_client_read"
  on public.quotes for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.user_type = 'client'
        and p.access_level in ('quote', 'both')
        and p.client_id = public.quotes.client_id
    )
  );

-- quote_sections follow quote visibility for clients
drop policy if exists "sections_client_read" on public.quote_sections;

create policy "sections_client_read"
  on public.quote_sections for select
  using (
    exists (
      select 1 from public.quotes q
      join public.profiles p on p.client_id = q.client_id
      where q.id = quote_sections.quote_id
        and p.id = auth.uid()
        and p.user_type = 'client'
        and p.access_level in ('quote', 'both')
    )
  );

-- ── RPC: get_my_access ────────────────────────────────────
-- Returns the current user's access info (used by the client
-- portal to know what to show).
create or replace function public.get_my_access()
returns table (
  user_type       text,
  client_id       uuid,
  access_level    text,
  client_name     text,
  survey_id       uuid,
  survey_token    text,
  survey_status   text,
  quote_id        uuid,
  quote_ref       text,
  quote_status    text
)
language sql
security definer
stable
as $$
  select
    p.user_type,
    p.client_id,
    p.access_level,
    c.name_ar                          as client_name,
    (select s.id    from public.surveys s where s.client_id = p.client_id order by s.created_at desc limit 1) as survey_id,
    (select s.token from public.surveys s where s.client_id = p.client_id order by s.created_at desc limit 1) as survey_token,
    (select s.status from public.surveys s where s.client_id = p.client_id order by s.created_at desc limit 1) as survey_status,
    (select q.id    from public.quotes  q where q.client_id = p.client_id order by q.created_at desc limit 1) as quote_id,
    (select q.ref   from public.quotes  q where q.client_id = p.client_id order by q.created_at desc limit 1) as quote_ref,
    (select q.status::text from public.quotes q where q.client_id = p.client_id order by q.created_at desc limit 1) as quote_status
  from public.profiles p
  left join public.clients c on c.id = p.client_id
  where p.id = auth.uid();
$$;

grant execute on function public.get_my_access() to authenticated;

notify pgrst, 'reload schema';
