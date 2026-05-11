-- ============================================================
-- BG Quotes — Add new modules pricing (Fleet, Contracting, Multi-Company)
-- ============================================================

insert into public.pricing_config (category, key, value, label) values
  ('module_price', 'fleet', 700, 'إدارة الأسطول'),
  ('module_price', 'contracting', 2200, 'إدارة المقاولات'),
  ('module_price', 'multicompany', 1500, 'الشركات المتعددة')
on conflict (category, key) do update set value = excluded.value, label = excluded.label;

-- Seed question weights for new modules
insert into public.pricing_config (category, key, value, label, metadata) values
  ('question_weight', 'flt_count', 0.05, 'عدد المركبات', '{"module":"fleet"}'),
  ('question_weight', 'flt_fuel', 0.08, 'تتبع الوقود', '{"module":"fleet"}'),
  ('question_weight', 'flt_maintenance', 0.08, 'صيانة وقائية', '{"module":"fleet"}'),
  ('question_weight', 'flt_insurance', 0.05, 'تأمين وتراخيص', '{"module":"fleet"}'),
  ('question_weight', 'flt_cost', 0.08, 'تحليل تكلفة المركبة', '{"module":"fleet"}'),
  ('question_weight', 'con_boq', 0.10, 'جداول كميات BOQ', '{"module":"contracting"}'),
  ('question_weight', 'con_retention', 0.10, 'مبالغ احتجاز', '{"module":"contracting"}'),
  ('question_weight', 'con_progress', 0.10, 'فواتير مرحلية', '{"module":"contracting"}'),
  ('question_weight', 'con_vo', 0.08, 'أوامر تغيير', '{"module":"contracting"}'),
  ('question_weight', 'con_sub', 0.10, 'مقاولين فرعيين', '{"module":"contracting"}'),
  ('question_weight', 'con_profitability', 0.08, 'ربحية المشروع', '{"module":"contracting"}'),
  ('question_weight', 'mc_interco', 0.12, 'عمليات بين الشركات', '{"module":"multicompany"}'),
  ('question_weight', 'mc_multi_currency', 0.10, 'عملات متعددة', '{"module":"multicompany"}'),
  ('question_weight', 'mc_consolidated', 0.10, 'تقارير مدمجة', '{"module":"multicompany"}'),
  ('question_weight', 'mc_diff_coa', 0.10, 'شجرة حسابات مختلفة', '{"module":"multicompany"}')
on conflict (category, key) do update set value = excluded.value, label = excluded.label, metadata = excluded.metadata;

-- Seed country-specific prices for new modules
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
  and mp.key in ('fleet', 'contracting', 'multicompany')
  and cm.category = 'country_multiplier'
on conflict (category, key) do nothing;
