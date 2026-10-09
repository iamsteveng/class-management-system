import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { sendOrderConfirmationWhatsApp, sendRainCancellationWhatsApp } from '../../lib/manychat';
import { buildRainFields } from '../../lib/orderMessage';

const ORDER_ENV = {
  MANYCHAT_API_KEY: 'key',
  MANYCHAT_ORDER_FLOW_NS: 'content_order',
  MANYCHAT_ORDER_FIELD_CLASS: 'cuf_1',
  MANYCHAT_ORDER_FIELD_WHEN: 'cuf_2',
  MANYCHAT_ORDER_FIELD_VENUE: 'cuf_3',
  MANYCHAT_ORDER_FIELD_LINK: 'cuf_4',
};
const fields = {
  booking_class: '常規班',
  booking_when: '10月24日（六） 14:00–15:00',
  booking_venue: '天水圍樂區單車亭',
  booking_link: 'https://example.com/apply/c/done?hold=h',
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async (url: string) => ({
    ok: true,
    status: 200,
    json: async () => (url.includes('createSubscriber') ? { data: { id: 42 } } : {}),
    text: async () => '',
  }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('ManyChat template messages', () => {
  it('skips the send until the flow and every field are configured', async () => {
    for (const [k, v] of Object.entries(ORDER_ENV)) if (k !== 'MANYCHAT_ORDER_FIELD_LINK') vi.stubEnv(k, v);
    const result = await sendOrderConfirmationWhatsApp({ to: '+85291234567', fields });
    expect(result).toMatchObject({ success: false, skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sets the four fields by their IDs, then starts the flow', async () => {
    for (const [k, v] of Object.entries(ORDER_ENV)) vi.stubEnv(k, v);
    const result = await sendOrderConfirmationWhatsApp({ to: '+85291234567', fields, subscriberId: '7' });
    expect(result).toEqual({ success: true, subscriberId: '7' });
    const [setFields, sendFlow] = fetchMock.mock.calls;
    expect(setFields[0]).toContain('setCustomFields');
    expect(JSON.parse(setFields[1].body)).toEqual({
      subscriber_id: 7,
      fields: [
        { field_id: 1, field_value: '常規班' },
        { field_id: 2, field_value: '10月24日（六） 14:00–15:00' },
        { field_id: 3, field_value: '天水圍樂區單車亭' },
        { field_id: 4, field_value: 'https://example.com/apply/c/done?hold=h' },
      ],
    });
    expect(JSON.parse(sendFlow[1].body)).toEqual({ subscriber_id: '7', flow_ns: 'content_order' });
  });

  it('creates the subscriber first when none is stored', async () => {
    for (const [k, v] of Object.entries(ORDER_ENV)) vi.stubEnv(k, v);
    const result = await sendOrderConfirmationWhatsApp({ to: '+85291234567', fields });
    expect(fetchMock.mock.calls[0][0]).toContain('createSubscriber');
    expect(result.subscriberId).toBe('42');
  });

  it('uses its own flow and fields for rain cancellations', async () => {
    vi.stubEnv('MANYCHAT_API_KEY', 'key');
    vi.stubEnv('MANYCHAT_RAIN_FLOW_NS', 'content_rain');
    for (const [i, f] of ['CLASS', 'WHEN', 'VENUE', 'LINK'].entries()) vi.stubEnv(`MANYCHAT_RAIN_FIELD_${f}`, `cuf_${10 + i}`);
    const rain = buildRainFields({
      baseUrl: 'https://example.com',
      participantId: 'p1',
      classNameZh: '幼兒班',
      sessionDate: '2026-10-25',
      sessionTime: '10:00',
      sessionEndTime: '11:00',
      locationZh: '青衣樂區單車亭',
    });
    expect(rain).toEqual({
      rain_class: '幼兒班',
      rain_when: '10月25日（日） 10:00–11:00',
      rain_venue: '青衣樂區單車亭',
      rain_link: 'https://example.com/participant/p1',
    });
    await sendRainCancellationWhatsApp({ to: '+85291234567', fields: rain, subscriberId: '7' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).fields.map((f: any) => f.field_id)).toEqual([10, 11, 12, 13]);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).flow_ns).toBe('content_rain');
  });
});
