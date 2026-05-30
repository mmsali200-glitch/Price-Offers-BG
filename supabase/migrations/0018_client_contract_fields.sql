-- ============================================================
-- BG Quotes — Extended client fields for contract generation
-- Adds the columns the contract template needs (legal rep, project
-- manager contact) so the same client record fully populates both
-- the quote and the contract without re-entry.
-- ============================================================

alter table public.clients
  add column if not exists legal_rep  text,
  add column if not exists pm_name    text,
  add column if not exists pm_phone   text,
  add column if not exists pm_email   text;

notify pgrst, 'reload schema';
