-- ============================================================
-- BG Quotes — Centralized Pricing Configuration
-- All prices, country multipliers, and question weights in one
-- table — editable from /settings/pricing by admins.
-- ============================================================

create table if not exists public.pricing_config (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,  -- module_price | country_multiplier | question_weight | support_price | bg_app_price
  key         text not null,  -- module ID | country name | question ID
  value       numeric(10,4) not null default 0,
  label       text,
  metadata    jsonb default '{}'::jsonb,
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz not null default now(),
  unique (category, key)
);

create index if not exists idx_pricing_category on public.pricing_config(category);

alter table public.pricing_config enable row level security;

-- Everyone can read pricing
drop policy if exists "pricing_read" on public.pricing_config;
create policy "pricing_read" on public.pricing_config for select using (true);

-- Only admins can write
drop policy if exists "pricing_admin_write" on public.pricing_config;
create policy "pricing_admin_write" on public.pricing_config for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ── Seed: Module base prices (KWD) ──────────────────────
insert into public.pricing_config (category, key, value, label) values
  ('module_price', 'crm', 700, 'CRM'),
  ('module_price', 'sales', 900, 'المبيعات'),
  ('module_price', 'pos', 700, 'نقاط البيع'),
  ('module_price', 'subscriptions', 500, 'الاشتراكات'),
  ('module_price', 'rental', 600, 'التأجير'),
  ('module_price', 'inventory', 1200, 'المخازن'),
  ('module_price', 'purchase', 800, 'المشتريات'),
  ('module_price', 'barcode', 400, 'الباركود'),
  ('module_price', 'delivery', 500, 'التوصيل'),
  ('module_price', 'repair', 550, 'الإصلاح'),
  ('module_price', 'mrp', 1100, 'التصنيع'),
  ('module_price', 'plm', 600, 'PLM'),
  ('module_price', 'maintenance', 500, 'الصيانة'),
  ('module_price', 'quality', 550, 'الجودة'),
  ('module_price', 'accounting', 1500, 'المحاسبة'),
  ('module_price', 'invoicing', 600, 'الفوترة'),
  ('module_price', 'expenses', 400, 'المصروفات'),
  ('module_price', 'payroll', 700, 'الرواتب'),
  ('module_price', 'hr', 500, 'الموظفون'),
  ('module_price', 'recruitment', 400, 'التوظيف'),
  ('module_price', 'leaves', 350, 'الإجازات'),
  ('module_price', 'appraisals', 400, 'تقييم الأداء'),
  ('module_price', 'attendance', 400, 'الحضور'),
  ('module_price', 'project', 500, 'المشاريع'),
  ('module_price', 'timesheets', 350, 'ساعات العمل'),
  ('module_price', 'fieldservice', 600, 'الخدمة الميدانية'),
  ('module_price', 'helpdesk', 500, 'الدعم الفني'),
  ('module_price', 'website', 800, 'الموقع'),
  ('module_price', 'ecommerce', 1000, 'التجارة الإلكترونية'),
  ('module_price', 'elearning', 500, 'التعلم'),
  ('module_price', 'livechat', 300, 'الدردشة'),
  ('module_price', 'realestate', 900, 'العقارات'),
  ('module_price', 'eam', 650, 'الأصول'),
  ('module_price', 'hms', 2000, 'المستشفيات'),
  ('module_price', 'lab', 800, 'المختبرات')
on conflict (category, key) do update set value = excluded.value, label = excluded.label;

-- ── Seed: Country multipliers ───────────────────────────
insert into public.pricing_config (category, key, value, label, metadata) values
  ('country_multiplier', 'الكويت', 1.00, 'الكويت', '{"currency":"KWD","symbol":"د.ك","exchange":1}'),
  ('country_multiplier', 'السعودية', 0.85, 'السعودية', '{"currency":"SAR","symbol":"ر.س","exchange":12.2}'),
  ('country_multiplier', 'الإمارات', 0.95, 'الإمارات', '{"currency":"AED","symbol":"د.إ","exchange":12.0}'),
  ('country_multiplier', 'قطر', 0.90, 'قطر', '{"currency":"QAR","symbol":"ر.ق","exchange":11.9}'),
  ('country_multiplier', 'البحرين', 0.95, 'البحرين', '{"currency":"BHD","symbol":"د.ب","exchange":1.23}'),
  ('country_multiplier', 'عمان', 0.90, 'عمان', '{"currency":"OMR","symbol":"ر.ع","exchange":1.26}'),
  ('country_multiplier', 'مصر', 0.55, 'مصر', '{"currency":"EGP","symbol":"ج.م","exchange":160}'),
  ('country_multiplier', 'الأردن', 0.65, 'الأردن', '{"currency":"JOD","symbol":"د.أ","exchange":2.32}')
on conflict (category, key) do update set value = excluded.value, metadata = excluded.metadata;

-- ── Seed: Support package prices ────────────────────────
insert into public.pricing_config (category, key, value, label) values
  ('support_price', 'basic', 250, 'أساسية'),
  ('support_price', 'advanced', 350, 'متقدمة'),
  ('support_price', 'premium', 450, 'مميزة')
on conflict (category, key) do update set value = excluded.value;

-- ── Seed: BG App prices ─────────────────────────────────
insert into public.pricing_config (category, key, value, label) values
  ('bg_app_price', 'onesales', 1200, 'One Sales'),
  ('bg_app_price', 'onetime', 800, 'One Time'),
  ('bg_app_price', 'bgdash', 500, 'BG Dashboard'),
  ('bg_app_price', 'bgwhatsapp', 400, 'BG WhatsApp')
on conflict (category, key) do update set value = excluded.value;
