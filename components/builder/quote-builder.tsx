"use client";

import { SectionClient, SectionVersion, SectionLanguage } from "./section-client";
import { SectionModules, SectionBGApps } from "./section-modules";
import { SectionOptions } from "./section-options";
import { SectionPhases } from "./section-phases";
import { SectionPayment } from "./section-payment";
import { SectionLicense } from "./section-license";
import { SectionSupport } from "./section-support";
import { SectionDescription } from "./section-description";
import { SectionContacts } from "./section-contacts";
import { SectionMeetingNotes, SectionExtraReqs, SectionDiscount } from "./section-notes";
import { SectionRequirements } from "./section-requirements";
import { SummaryBar } from "./summary-bar";
import { Sparkles } from "lucide-react";

export function QuoteBuilder() {
  return (
    <div className="max-w-5xl mx-auto px-3 lg:px-6 py-4 lg:py-6 space-y-3 pb-24">
      {/* Header */}
      <header className="text-center py-4 space-y-1">
        <h1 className="text-2xl lg:text-3xl font-black text-bg-green">
          🟢 مُعِد عروض الأسعار
        </h1>
        <p className="text-xs text-bg-text-3">
          <span className="text-bg-gold font-bold">Business Gate Technical Consulting</span>
          {" — كل عرض في دقائق"}
        </p>
      </header>

      <SectionClient />
      <SectionLanguage />
      <SectionVersion />
      <SectionModules />
      <SectionBGApps />
      <SectionOptions />
      <SectionPhases />
      <SectionPayment />
      <SectionLicense />
      <SectionSupport />
      <SectionRequirements />
      <SectionDescription />
      <SectionContacts />
      <SectionExtraReqs />
      <SectionMeetingNotes />
      <SectionDiscount />

      <SummaryBar />

      <button
        type="button"
        className="w-full py-4 rounded-card bg-gradient-to-br from-bg-green to-bg-green-2 text-white font-black text-base shadow-[0_5px_20px_rgba(26,92,55,0.26)] hover:shadow-[0_9px_28px_rgba(26,92,55,0.36)] hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2"
      >
        <Sparkles className="size-5" />
        توليد العرض النهائي (Phase 3)
      </button>
    </div>
  );
}
