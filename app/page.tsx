import { LanguageProvider } from './contexts/LanguageContext';
import { ResponsiveLanding } from './components/homepage/ResponsiveLanding';

export default function Home() {
  return (
    <LanguageProvider>
      <ResponsiveLanding />
    </LanguageProvider>
  );
}
