import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CoursesSection } from '../../app/components/homepage/CoursesSection';
import { LanguageProvider } from '../../app/contexts/LanguageContext';

// Wrap with required context
function renderWithProvider(ui: React.ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

const mockClasses = [
  {
    class_id: 'class_cycling_fundamentals',
    name_zh: '單車新手速成班',
    name_en: 'Cycling Fundamentals',
    description: 'Learn the basics of cycling',
    payment_url: 'https://example.com/pay-cycling',
  },
  {
    class_id: 'class_city_guided_tour',
    name_zh: '城市導賞騎行',
    name_en: 'City Guided Tour',
    description: 'Explore the city on a bike',
    payment_url: 'https://example.com/pay-tour',
  },
  {
    class_id: 'unknown_class_id',
    name_zh: 'Unknown Class ZH',
    description: 'This should be skipped',
    payment_url: 'https://example.com/pay-unknown',
  },
];

const mockSessions = {
  class_cycling_fundamentals: [
    { session_id: 's1', date: '2026-04-01', time: '09:00', location_zh: '香港公園', quota_available: 5 },
    { session_id: 's2', date: '2026-04-08', time: '10:00', location_zh: '西九龍', quota_available: 0 },
  ],
  class_city_guided_tour: [
    { session_id: 's3', date: '2026-04-15', time: '14:00', location_zh: '市中心', quota_available: 2 },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('CoursesSection', () => {
  it('shows loading skeleton while fetch is pending', () => {
    // Mock fetch to never resolve
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}));
    renderWithProvider(<CoursesSection />);
    // Skeleton cards use animate-pulse
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders course cards when API returns data (ZH language)', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.endsWith('/api/classes')) {
        return Promise.resolve(new Response(JSON.stringify({ classes: mockClasses }), { status: 200 }));
      }
      if (urlStr.includes('/api/classes/class_cycling_fundamentals/sessions')) {
        return Promise.resolve(new Response(JSON.stringify({ sessions: mockSessions.class_cycling_fundamentals }), { status: 200 }));
      }
      if (urlStr.includes('/api/classes/class_city_guided_tour/sessions')) {
        return Promise.resolve(new Response(JSON.stringify({ sessions: mockSessions.class_city_guided_tour }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ sessions: [] }), { status: 200 }));
    });

    renderWithProvider(<CoursesSection />);

    // Default language is zh-TW, so name_zh is shown
    await waitFor(() => {
      expect(screen.getByText('單車新手速成班')).toBeInTheDocument();
    });
    expect(screen.getByText('城市導賞騎行')).toBeInTheDocument();
  });

  it('shows FULL badge on sessions with quota_available=0', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.endsWith('/api/classes')) {
        return Promise.resolve(new Response(JSON.stringify({ classes: [mockClasses[0]] }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ sessions: mockSessions.class_cycling_fundamentals }), { status: 200 }));
    });

    renderWithProvider(<CoursesSection />);

    await waitFor(() => {
      expect(screen.getByText('FULL')).toBeInTheDocument();
    });
  });

  it('skips classes not in courseConfig', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.endsWith('/api/classes')) {
        return Promise.resolve(new Response(JSON.stringify({ classes: [mockClasses[2]] }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ sessions: [] }), { status: 200 }));
    });

    renderWithProvider(<CoursesSection />);

    await waitFor(() => {
      // After loading, unknown class should not be rendered
      expect(screen.queryByText('Unknown Class ZH')).not.toBeInTheDocument();
    });
  });

  it('shows no upcoming classes message when array is empty', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.endsWith('/api/classes')) {
        return Promise.resolve(new Response(JSON.stringify({ classes: [] }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ sessions: [] }), { status: 200 }));
    });

    renderWithProvider(<CoursesSection />);

    await waitFor(() => {
      expect(screen.getByText('No upcoming classes')).toBeInTheDocument();
    });
  });
});
