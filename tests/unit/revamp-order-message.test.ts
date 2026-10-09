import { describe, it, expect } from 'vitest';

import { buildOrderFields, buildSessionIcs } from '../../lib/orderMessage';

describe('buildOrderFields', () => {
  it('gives one single-line value per template variable, linking to everyone\'s QR', () => {
    const fields = buildOrderFields({
      baseUrl: 'https://example.com',
      classId: 'class_cycling_regular',
      holdId: 'hold-1',
      classNameZh: '常規班',
      sessionDate: '2026-10-24',
      sessionTime: '14:00',
      sessionEndTime: '15:00',
      locationZh: '天水圍\n樂區單車亭',
    });
    expect(fields).toEqual({
      booking_class: '常規班',
      booking_when: '10月24日（六） 14:00–15:00',
      booking_venue: '天水圍 樂區單車亭',
      booking_link: 'https://example.com/apply/class_cycling_regular/done?hold=hold-1',
    });
    // WhatsApp template variables can't contain line breaks or tabs
    for (const value of Object.values(fields)) expect(value).not.toMatch(/[\n\t]/);
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
