/**
 * Pre-built quote templates tuned to common business sectors.
 * Picking a template pre-selects modules, BG apps, support, and user
 * count — giving sales a 30-second head start over a blank Builder.
 */

import type { QuoteBuilderState } from "@/lib/builder/types";

export type QuoteTemplate = {
  id: string;
  name: string;
  sector: QuoteBuilderState["client"]["sector"];
  icon: string;
  description: string;
  tagline: string;
  moduleIds: string[];
  bgAppIds: string[];
  supportPackage: QuoteBuilderState["support"]["packageId"];
  licenseType: QuoteBuilderState["license"]["type"];
  userCount: number;
  durationLabel: string;
  odooVersion: QuoteBuilderState["odooVersion"];
};

export const QUOTE_TEMPLATES: QuoteTemplate[] = [
  {
    id: "trading-basic",
    name: "تجارة وتوزيع — الأساسي",
    sector: "trading",
    icon: "🏢",
    tagline: "شركة توزيع متوسطة الحجم",
    description:
      "CRM + مبيعات + مخازن + مشتريات + محاسبة + فوترة. الباقة الأكثر طلباً لشركات التجارة.",
    moduleIds: [
      "crm", "sales", "inventory", "purchase", "accounting",
      "invoicing", "hr", "payroll",
    ],
    bgAppIds: [],
    supportPackage: "advanced",
    licenseType: "Odoo.sh",
    userCount: 10,
    durationLabel: "60 يوم",
    odooVersion: "18",
  },
  {
    id: "trading-field",
    name: "تجارة + مناديب ميدانيين",
    sector: "trading",
    icon: "🚛",
    tagline: "شركات التوزيع بفريق مبيعات ميداني",
    description:
      "كل ميزات التجارة + تطبيق One Sales لزيارات المناديب وتتبع GPS + الباركود للمخازن.",
    moduleIds: [
      "crm", "sales", "inventory", "purchase", "accounting",
      "invoicing", "barcode", "delivery", "hr", "payroll",
    ],
    bgAppIds: ["onesales", "bgwhatsapp"],
    supportPackage: "advanced",
    licenseType: "Odoo.sh",
    userCount: 15,
    durationLabel: "90 يوم",
    odooVersion: "18",
  },
  {
    id: "healthcare-clinic",
    name: "عيادة / مستشفى",
    sector: "healthcare",
    icon: "🏥",
    tagline: "مستشفى متعدد الأقسام أو مجموعة عيادات",
    description:
      "إدارة المستشفيات (HMS) + المختبرات الطبية + محاسبة + موارد بشرية + فوترة تأمين.",
    moduleIds: [
      "hms", "lab", "accounting", "invoicing", "hr",
      "payroll", "inventory", "purchase",
    ],
    bgAppIds: ["bgdash"],
    supportPackage: "premium",
    licenseType: "Enterprise On-Premise",
    userCount: 25,
    durationLabel: "120 يوم",
    odooVersion: "18",
  },
  {
    id: "manufacturing-full",
    name: "تصنيع وإنتاج",
    sector: "manufacturing",
    icon: "🏭",
    tagline: "مصنع متكامل — من المواد الخام إلى الشحن",
    description:
      "MRP + BOM + PLM + جودة + صيانة + مخازن + مشتريات + محاسبة. تكامل كامل لدورة الإنتاج.",
    moduleIds: [
      "mrp", "plm", "quality", "maintenance", "inventory",
      "purchase", "sales", "accounting", "invoicing", "hr",
      "payroll", "barcode",
    ],
    bgAppIds: ["onetime", "bgdash"],
    supportPackage: "premium",
    licenseType: "Enterprise On-Premise",
    userCount: 30,
    durationLabel: "120 يوم",
    odooVersion: "18",
  },
  {
    id: "realestate-mgmt",
    name: "إدارة عقارات وأملاك",
    sector: "realestate",
    icon: "🏢",
    tagline: "شركات إدارة الوحدات والتأجير",
    description:
      "إدارة الوحدات + عقود الإيجار + التحصيل + المحاسبة + CRM العملاء + الصيانة.",
    moduleIds: [
      "realestate", "eam", "accounting", "invoicing", "crm",
      "maintenance", "hr", "payroll",
    ],
    bgAppIds: ["bgwhatsapp"],
    supportPackage: "advanced",
    licenseType: "Odoo.sh",
    userCount: 8,
    durationLabel: "90 يوم",
    odooVersion: "18",
  },
  {
    id: "retail-multi",
    name: "تجزئة — فروع ومحلات",
    sector: "retail",
    icon: "🛍️",
    tagline: "متاجر متعددة الفروع + نقاط بيع",
    description:
      "POS + مبيعات + مخازن + موقع إلكتروني + تجارة إلكترونية + محاسبة + موارد بشرية.",
    moduleIds: [
      "pos", "sales", "inventory", "purchase", "accounting",
      "invoicing", "website", "ecommerce", "hr", "payroll",
      "barcode",
    ],
    bgAppIds: ["bgdash"],
    supportPackage: "advanced",
    licenseType: "Odoo.sh",
    userCount: 20,
    durationLabel: "90 يوم",
    odooVersion: "18",
  },
  {
    id: "services-consult",
    name: "خدمات مهنية واستشارات",
    sector: "services",
    icon: "💼",
    tagline: "مكاتب محاماة، محاسبة، استشارات",
    description:
      "المشاريع + ساعات العمل + فوترة بالساعة + CRM + المحاسبة + الموارد البشرية.",
    moduleIds: [
      "project", "timesheets", "invoicing", "crm", "accounting",
      "hr", "expenses", "helpdesk",
    ],
    bgAppIds: ["onetime"],
    supportPackage: "basic",
    licenseType: "Odoo.sh",
    userCount: 12,
    durationLabel: "45 يوم",
    odooVersion: "18",
  },
  {
    id: "food-restaurant",
    name: "مطاعم وأغذية",
    sector: "food",
    icon: "🍽️",
    tagline: "سلاسل المطاعم والمقاهي",
    description:
      "POS + مخازن بالصلاحية + مشتريات + المحاسبة + الموظفين + تكلفة الوجبات.",
    moduleIds: [
      "pos", "inventory", "purchase", "accounting", "invoicing",
      "hr", "payroll", "attendance", "leaves",
    ],
    bgAppIds: ["bgwhatsapp"],
    supportPackage: "advanced",
    licenseType: "Odoo.sh",
    userCount: 15,
    durationLabel: "60 يوم",
    odooVersion: "18",
  },
];

export function findTemplate(id: string): QuoteTemplate | undefined {
  return QUOTE_TEMPLATES.find((t) => t.id === id);
}
