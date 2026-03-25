import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { AboutUsSection } from './AboutUsSection';
import { CoursesSection } from './CoursesSection';
import { Footer } from './Footer';

export function ResponsiveLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* About Us Section */}
      <AboutUsSection />

      {/* Courses Section */}
      <CoursesSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
