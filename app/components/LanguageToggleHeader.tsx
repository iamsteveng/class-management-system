'use client';

import { useLanguage } from '../contexts/LanguageContext';

export function LanguageToggleHeader() {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="flex justify-end px-4 py-2 border-b border-gray-200 bg-white">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setLanguage('zh-TW')}
          className={`px-2 py-1 rounded ${
            language === 'zh-TW'
              ? 'font-bold text-[#44b0e2] underline'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          中文
        </button>
        <span className="text-gray-300 self-center">|</span>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2 py-1 rounded ${
            language === 'en'
              ? 'font-bold text-[#44b0e2] underline'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          EN
        </button>
      </div>
    </header>
  );
}
