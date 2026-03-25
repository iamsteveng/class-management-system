'use client';

import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { AboutUsSection } from './AboutUsSection';
import { CoursesSection } from './CoursesSection';
import { FaqSection } from './FaqSection';
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

      {/* FAQ Section */}
      <FaqSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
