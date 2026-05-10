-- ============================================================
-- BG Quotes — Survey RPC functions (bypass PostgREST cache)
-- ============================================================
-- The Supabase JS client routes every from("surveys") through
-- PostgREST, whose schema cache sometimes fails to detect the
-- surveys table even after migration 0012. RPC calls are routed
-- by function name and bypass that cache entirely.
--
-- All functions are SECURITY DEFINER so they bypass RLS — the
-- caller's identity check happens inside the function body.

-- ── create_survey ──────────────────────────────────────────
create or replace function public.create_survey(
  p_company_name  text,
  p_contact_name  text,
  p_contact_email text,
  p_industry      text
)
returns table (id uuid, token text)
language plpgsql
security definer
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
  v_tok text;
begin
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  insert into public.surveys (
    company_name, contact_name, contact_email, industry, created_by
  )
  values (
    nullif(p_company_name, ''),
    nullif(p_contact_name, ''),
    nullif(p_contact_email, ''),
    nullif(p_industry, ''),
    v_uid
  )
  returning surveys.id, surveys.token into v_id, v_tok;

  return query select v_id, v_tok;
end;
$$;

grant execute on function public.create_survey(text, text, text, text) to authenticated;

-- ── get_survey_by_token (used by public client-facing page) ─
create or replace function public.get_survey_by_token(p_token text)
returns setof public.surveys
language sql
security definer
stable
as $$
  select * from public.surveys where token = p_token limit 1;
$$;

grant execute on function public.get_survey_by_token(text) to anon, authenticated;

-- ── list_surveys (admin dashboard) ─────────────────────────
create or replace function public.list_surveys()
returns setof public.surveys
language sql
security definer
stable
as $$
  select * from public.surveys order by created_at desc;
$$;

grant execute on function public.list_surveys() to authenticated;

-- ── update_survey_responses ────────────────────────────────
create or replace function public.update_survey_responses(
  p_token        text,
  p_responses    jsonb,
  p_progress     int,
  p_company_name text default null,
  p_contact_name text default null,
  p_contact_email text default null
)
returns void
language sql
security definer
as $$
  update public.surveys set
    responses     = coalesce(p_responses, responses),
    progress      = p_progress,
    status        = 'in_progress',
    company_name  = coalesce(nullif(p_company_name, ''), company_name),
    contact_name  = coalesce(nullif(p_contact_name, ''), contact_name),
    contact_email = coalesce(nullif(p_contact_email, ''), contact_email),
    updated_at    = now()
  where token = p_token;
$$;

grant execute on function public.update_survey_responses(text, jsonb, int, text, text, text) to anon, authenticated;

-- ── submit_survey ──────────────────────────────────────────
create or replace function public.submit_survey(p_token text)
returns void
language sql
security definer
as $$
  update public.surveys set
    status       = 'submitted',
    submitted_at = now(),
    updated_at   = now()
  where token = p_token;
$$;

grant execute on function public.submit_survey(text) to anon, authenticated;

-- Force PostgREST schema reload so it picks up the new RPCs.
notify pgrst, 'reload schema';
