import { describe, it, expect } from 'vitest';

import { buildOrderSummary, buildSessionIcs } from '../../lib/orderMessage';

describe('buildOrderSummary', () => {
  it('lists the Session, Venue and each Participant Link', () => {
    const text = buildOrderSummary({
      baseUrl: 'https://example.com',
      classNameZh: '常規班',
      sessionDate: '2026-10-24',
      sessionTime: '14:00',
      sessionEndTime: '15:00',
      locationZh: '天水圍樂區單車亭',
      googleMapsUrl: 'https://maps.example/x',
      participants: [
        { participant_id: 'p-1', name: '陳大文' },
        { participant_id: 'p-2', name: '陳小文' },
      ],
    });
    expect(text).toBe(
      [
        '常規班',
        '10月24日（六） 14:00–15:00',
        '天水圍樂區單車亭',
        'https://maps.example/x',
        '',
        '學員資料及出席 QR Code：',
        '陳大文：https://example.com/participant/p-1',
        '陳小文：https://example.com/participant/p-2',
      ].join('\n')
    );
  });
});

describe('buildSessionIcs', () => {
  it('converts Hong Kong time to UTC', () => {
    const ics = buildSessionIcs({
      uid: 'u1',
      title: '常規班',
      date: '2026-10-24',
      startTime: '14:00',
      endTime: '15:00',
      location: '天水圍, 天福路',
    });
    expect(ics).toContain('DTSTART:20261024T060000Z');
    expect(ics).toContain('DTEND:20261024T070000Z');
    expect(ics).toContain('LOCATION:天水圍\\, 天福路');
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });

  it('falls back to the duration when there is no end time', () => {
    const ics = buildSessionIcs({ uid: 'u', title: 't', date: '2026-10-24', startTime: '23:30', location: 'x' });
    expect(ics).toContain('DTEND:20261024T163000Z');
  });
});
