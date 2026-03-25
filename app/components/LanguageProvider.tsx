'use client';

import { ReactNode } from 'react';
import { LanguageProvider as ContextLanguageProvider } from '../contexts/LanguageContext';

export function LanguageProvider({ children }: { children: ReactNode }) {
  return <ContextLanguageProvider>{children}</ContextLanguageProvider>;
}
