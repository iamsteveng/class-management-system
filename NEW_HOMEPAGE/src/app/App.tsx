import { LanguageProvider } from "./contexts/LanguageContext";
import { ResponsiveLanding } from "./components/ResponsiveLanding";

export default function App() {
  return (
    <LanguageProvider>
      <ResponsiveLanding />
    </LanguageProvider>
  );
}