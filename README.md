# BG Quotes — Business Gate Technical Consulting

منصة متكاملة لإدارة دورة حياة عروض أسعار **Business Gate Technical Consulting**: إنشاء العرض، توليد محتواه بذكاء اصطناعي، إرساله للعميل عبر رابط آمن، والتوقيع الإلكتروني.

**Integrated quote platform for Business Gate Technical Consulting**: build quotes, AI-generate content, deliver via secure client links, and e-sign.

---

## البنية التقنية | Stack

- **Next.js 15** (App Router, TypeScript, React 19)
- **TailwindCSS** + نظام تصميم BG (أخضر `#1a5c37` + ذهبي `#c9a84c`) + RTL + Noto Sans Arabic
- **Supabase** — Postgres + Auth (Magic Link) + RLS + Storage
- **Claude API** (Sonnet 4.6 + prompt caching) — توليد HTML للعرض النهائي
- **Resend** — إرسال البريد للعملاء
- **Puppeteer** — توليد PDF بجودة طباعة A4
- **react-signature-canvas** — التوقيع الإلكتروني
- **Vercel** — النشر

---

## الإعداد السريع | Quick Setup

```bash
# 1. نسخ متغيرات البيئة
cp .env.example .env.local
# ثم املأ: Supabase URL + anon key + service_role key
#          ANTHROPIC_API_KEY + RESEND_API_KEY

# 2. تثبيت التبعيات
npm install

# 3. تطبيق مخطط قاعدة البيانات
# (من Supabase Dashboard → SQL Editor → الصق محتوى supabase/migrations/0001_initial_schema.sql)

# 4. التشغيل المحلي
npm run dev
# افتح http://localhost:3000
```

---

## خارطة الطريق | Roadmap (7 مراحل)

| المرحلة | الحالة | الوصف |
|--------|-------|-------|
| 1. الأساس | ✅ | Next.js + Supabase + UI base + RTL |
| 2. Builder في التطبيق | ⏳ | نقل منطق v3 + حفظ تلقائي |
| 3. توليد العرض بـ Claude | ⏳ | Streaming API + prompt caching |
| 4. بوابة العميل + التوقيع | ⏳ | Magic link + react-signature-canvas |
| 5. لوحة الإحصائيات | ⏳ | KPIs + Pipeline + Filters |
| 6. PDF + البريد | ⏳ | Puppeteer A4 + Resend |
| 7. WhatsApp + التشطيب | ⏳ | wa.me links → Business API |

---

## بنية المشروع | Structure

```
app/
├── (app)/             # صفحات مُصادَقة
│   ├── dashboard/     # لوحة التحكم
│   ├── quotes/        # قائمة + Builder
│   ├── clients/       # العملاء
│   └── layout.tsx     # Sidebar + Topbar
├── q/[token]/         # بوابة العميل (Magic link)
├── api/               # Route handlers
├── layout.tsx         # Root layout (RTL + Noto Sans Arabic)
└── page.tsx           # صفحة الترحيب

components/
├── app-shell.tsx      # wrapper للصفحات المحمية
├── sidebar.tsx        # Sidebar يمين
└── topbar.tsx         # Top bar

lib/
├── supabase/          # client/server/admin
├── claude.ts          # Anthropic SDK + prompt caching
├── bg-skill.ts        # Skill v3 (system prompt لـ Claude)
├── modules-catalog.ts # 46 موديول Odoo + 4 تطبيقات BG
└── utils.ts           # helpers (cn, fmt, dates, refs)

supabase/
└── migrations/        # schema + RLS + triggers
```

---

## الاتصال | Contact

**م. محمود عون** — المدير التنفيذي
+965 9999 0412 · OUN@businessesgates.com · www.businessesgates.com
