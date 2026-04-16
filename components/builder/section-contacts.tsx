"use client";

import { useState } from "react";
import { SectionCard, Field } from "./section-card";
import { useBuilderStore } from "@/lib/builder/store";
import { cn } from "@/lib/utils";

export function SectionContacts() {
  const contacts = useBuilderStore((s) => s.contacts);
  const selectedId = useBuilderStore((s) => s.selectedContactId);
  const select = useBuilderStore((s) => s.selectContact);
  const add = useBuilderStore((s) => s.addContact);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  function handleAdd() {
    if (!name.trim()) return;
    add({ name, role: role || "Business Gate", phone, email });
    setName("");
    setRole("");
    setPhone("");
    setEmail("");
  }

  return (
    <SectionCard icon="👤" title="جهة الاتصال في العرض" subtitle="يظهر في ذيل العرض وخانة التوقيع">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        {contacts.map((c) => {
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => select(c.id)}
              className={cn(
                "rounded-sm2 border-[1.5px] p-3 text-right transition-colors",
                active ? "border-bg-green bg-bg-green-lt" : "border-bg-line hover:border-bg-green-2"
              )}
            >
              <div className={cn("text-xs font-black", active ? "text-bg-green" : "text-bg-text-1")}>
                {c.isDefault && (
                  <span className="text-[9px] bg-bg-green text-white px-1.5 py-0.5 rounded-full ml-1.5 font-bold">
                    افتراضي
                  </span>
                )}
                {c.name}
              </div>
              <div className="text-[10px] text-bg-text-3 mt-0.5">{c.role}</div>
              <div className="text-[10px] text-bg-text-3 mt-0.5">
                {c.phone} · {c.email}
              </div>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-bg-line my-3" />

      <div className="rounded-sm2 border-[1.5px] border-dashed border-bg-line-mid p-3 bg-bg-card-alt">
        <div className="text-[10px] font-black text-bg-text-3 uppercase tracking-wide mb-2">
          إضافة جهة اتصال مخصصة
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <Field label="الاسم">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="م. أسامة السيد" />
          </Field>
          <Field label="المسمى الوظيفي">
            <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="مدير مبيعات" />
          </Field>
          <Field label="الهاتف">
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+965 ..." />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Field label="البريد الإلكتروني">
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@bg-tc.com" />
          </Field>
          <div className="flex items-end">
            <button type="button" onClick={handleAdd} className="btn-primary w-full">
              حفظ وإضافة
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
