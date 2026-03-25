/**
 * Returns the localized text based on language preference.
 * EN: returns en if set, falls back to zh.
 * ZH: always returns zh.
 */
export function getLocalizedText(
  zh: string,
  en: string | undefined,
  lang: 'zh' | 'en'
): string {
  if (lang === 'en') {
    return en ?? zh;
  }
  return zh;
}
