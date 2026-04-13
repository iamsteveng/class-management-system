"use client";

import { useLanguage } from "../contexts/LanguageContext";
import { termsTranslations } from "../i18n/termsTranslations";

type PurchaseDetailsSectionProps = {
  customer_mobile: string;
  participant_count: number;
  class_name?: string;
};

export function PurchaseDetailsSection({
  customer_mobile,
  participant_count,
  class_name,
}: PurchaseDetailsSectionProps) {
  const { language } = useLanguage();
  const tr = termsTranslations[language];

  return (
    <section className="rounded-xl border border-zinc-200 p-5">
      <h2 className="text-lg font-medium text-zinc-900">{tr.purchaseDetails}</h2>
      <dl className="mt-3 grid gap-2 text-sm text-zinc-700">
        <div>
          <dt className="font-medium text-zinc-900">{tr.customerMobileLabel}</dt>
          <dd>{customer_mobile}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-900">{tr.participantsLabel}</dt>
          <dd>{participant_count}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-900">{tr.classLabel}</dt>
          <dd>{class_name ?? tr.classNotSelected}</dd>
        </div>
      </dl>
    </section>
  );
}
