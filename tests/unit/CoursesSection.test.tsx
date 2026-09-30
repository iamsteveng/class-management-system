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
    description_zh: '教你由零出發學識踩單車',
    description_en: 'Learn to ride a bike from scratch',
    duration_minutes: 180,
    image_url: '/images/homepage/cycling.png',
    airwallex_price: 298,
    airwallex_currency: 'HKD',
    airwallex_group_price: 250,
    airwallex_group_min_qty: 2,
    sessions: [
      { session_id: 's1', date: '2026-04-01', time: '09:00', location_zh: '香港公園', quota_available: 5 },
      { session_id: 's2', date: '2026-04-08', time: '10:00', location_zh: '西九龍', quota_available: 0 },
    ],
  },
  {
    class_id: 'class_city_guided_tour',
    name_zh: '城市導賞騎行',
    name_en: 'City Guided Tour',
    is_free: true,
    sessions: [
      { session_id: 's3', date: '2026-04-15', time: '14:00', location_zh: '市中心', quota_available: 2 },
    ],
  },
];

function mockClassesResponse(classes: unknown[]) {
  return vi.spyOn(global, 'fetch').mockImplementation(() =>
    Promise.resolve(new Response(JSON.stringify({ classes }), { status: 200 }))
  );
}

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

  it('renders course cards from a single classes request (ZH language)', async () => {
    const fetchSpy = mockClassesResponse(mockClasses);

    renderWithProvider(<CoursesSection />);

    // Default language is zh-TW, so zh content is shown
    await waitFor(() => {
      expect(screen.getByText('單車新手速成班')).toBeInTheDocument();
    });
    expect(screen.getByText('城市導賞騎行')).toBeInTheDocument();
    expect(screen.getByText('教你由零出發學識踩單車')).toBeInTheDocument();
    expect(screen.getByText('3 小時')).toBeInTheDocument();
    expect(screen.getByAltText('單車新手速成班')).toHaveAttribute('src', '/images/homepage/cycling.png');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('shows FULL badge on sessions with quota_available=0', async () => {
    mockClassesResponse([mockClasses[0]]);

    renderWithProvider(<CoursesSection />);

    await waitFor(() => {
      expect(screen.getByText('FULL')).toBeInTheDocument();
    });
  });

  it('renders a Class without card content using a placeholder image and no duration', async () => {
    mockClassesResponse([mockClasses[1]]);

    renderWithProvider(<CoursesSection />);

    await waitFor(() => {
      expect(screen.getByText('城市導賞騎行')).toBeInTheDocument();
    });
    expect(screen.getByTestId('course-image-placeholder')).toBeInTheDocument();
    expect(screen.queryByText(/小時/)).not.toBeInTheDocument();
  });

  it('shows no upcoming classes message when array is empty', async () => {
    mockClassesResponse([]);

    renderWithProvider(<CoursesSection />);

    await waitFor(() => {
      expect(screen.getByText('No upcoming classes')).toBeInTheDocument();
    });
  });
});
