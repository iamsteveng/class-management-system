"use client";

import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FAQ_ITEMS } from '../../i18n/faqConfig';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`shrink-0 w-5 h-5 text-[#44b0e2] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#dcdcdc] rounded-[16px] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white hover:bg-[#f4fcff] transition-colors"
      >
        <span className="font-['Roboto:Semibold','Noto_Sans_JP:Bold',sans-serif] text-[16px] leading-[24px] text-[#141414]" style={{ fontVariationSettings: "'wght' 700" }}>
          {question}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-6 py-5 bg-[#f4fcff] border-t border-[#dcdcdc]">
          <p className="font-['Roboto:Regular','Noto_Sans_JP:Regular',sans-serif] text-[14px] leading-[24px] text-[#292929] whitespace-pre-line" style={{ fontVariationSettings: "'wdth' 100" }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export function FaqSection() {
  const { language } = useLanguage();

  const title_zh = '常見問題';
  const title_en = 'Frequently Asked Questions';

  return (
    <section className="relative w-full py-[60px] lg:py-[80px] px-4 sm:px-6 lg:px-[80px] bg-[#f8f8f8]" data-name="FAQ">
      <div className="max-w-[900px] mx-auto flex flex-col gap-[32px]">
        {/* Section title */}
        <h2
          className="font-['Comfortaa:Semibold','Noto_Sans_JP:Bold',sans-serif] text-[28px] lg:text-[36px] leading-[40px] text-[#141414]"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          {language === 'zh-TW' ? title_zh : title_en}
        </h2>

        {/* FAQ items */}
        <div className="flex flex-col gap-[12px]">
          {FAQ_ITEMS.map((item) => (
            <FaqItem
              key={item.id}
              question={language === 'zh-TW' ? item.question_zh : item.question_en}
              answer={language === 'zh-TW' ? item.answer_zh : item.answer_en}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
