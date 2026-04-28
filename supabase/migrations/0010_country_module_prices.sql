-- ============================================================
-- BG Quotes — Per-country module pricing
-- Allows setting specific prices for each module in each country
-- Falls back to base_price × country_multiplier if not set
-- ============================================================

-- Seed initial country-specific module prices from base × multiplier
-- This gives admins a starting point to customize per country
insert into public.pricing_config (category, key, value, label, metadata)
select
  'country_module_price',
  cm.key || ':' || mp.key,
  round(mp.value * cm.value, 0),
  mp.label,
  jsonb_build_object('country', cm.key, 'module', mp.key, 'base', mp.value, 'multiplier', cm.value)
from public.pricing_config mp
cross join public.pricing_config cm
where mp.category = 'module_price'
  and cm.category = 'country_multiplier'
on conflict (category, key) do nothing;
