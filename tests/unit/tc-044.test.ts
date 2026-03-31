import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendTermsAcceptanceWhatsApp } from '../../lib/manychat';

/**
 * TC-044 US-019: Handle ManyChat "WhatsApp ID already exists" error
 *
 * When createSubscriber returns HTTP 400 "WhatsApp ID already exists",
 * the function must extract wa_id from the error body and retry
 * findBySystemField lookups before giving up.
 */
describe('TC-044 US-019 ManyChat already-exists error path', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.MANYCHAT_API_KEY = 'test-api-key-us019';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MANYCHAT_API_KEY;
  });

  it('TC-044: resolves subscriber via wa_id lookup when createSubscriber returns 400 already-exists', async () => {
    const to = '+85262875094';
    const phoneDigits = '85262875094';
    const waId = '85262875094';
    const subscriberId = '55551234';
    const termsUrl = 'https://example.com/terms?token=us019';

    // 1. findBySystemField(whatsapp_phone, E.164 with +) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 2. findBySystemField(whatsapp_phone, digits only) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 3. createSubscriber → 400 "WhatsApp ID already exists" with wa_id in data
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        status: 'error',
        message: 'WhatsApp ID already exists',
        data: { wa_id: waId },
      }),
    });

    // 4. findBySystemField(wa_id, waId) → found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });

    // 5. sendContent → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(5);

    // Verify wa_id lookup was attempted
    const waIdCall = fetchMock.mock.calls[3];
    const waIdBody = JSON.parse(waIdCall[1].body);
    expect(waIdBody.field_name).toBe('wa_id');
    expect(waIdBody.field_value).toBe(phoneDigits); // no + prefix

    // Verify sendContent used the resolved subscriber ID
    const sendBody = JSON.parse(fetchMock.mock.calls[4][1].body);
    expect(sendBody.subscriber_id).toBe(subscriberId);
  });

  it('TC-044: falls back to whatsapp_phone (no +) lookup when wa_id lookup fails', async () => {
    const to = '+85262875094';
    const phoneDigits = '85262875094';
    const subscriberId = '99998888';
    const termsUrl = 'https://example.com/terms?token=us019-fallback';

    // 1. findBySystemField(whatsapp_phone, +phone) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 2. findBySystemField(whatsapp_phone, digits) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 3. createSubscriber → 400 already-exists, wa_id in details field
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        status: 'error',
        message: 'WhatsApp ID already exists',
        details: { wa_id: phoneDigits },
      }),
    });

    // 4. findBySystemField(wa_id, ...) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 5. findBySystemField(whatsapp_phone, digits) → found (final fallback)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });

    // 6. sendContent → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(6);

    // Final fallback should be whatsapp_phone with digits only
    const fallbackBody = JSON.parse(fetchMock.mock.calls[4][1].body);
    expect(fallbackBody.field_name).toBe('whatsapp_phone');
    expect(fallbackBody.field_value).toBe(phoneDigits);
  });

  it('TC-044: returns false when already-exists and all subsequent lookups fail', async () => {
    const to = '+85262875094';
    const phoneDigits = '85262875094';
    const termsUrl = 'https://example.com/terms?token=us019-allfail';

    // 1. findBySystemField(whatsapp_phone, +phone) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 2. findBySystemField(whatsapp_phone, digits) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 3. createSubscriber → 400 already-exists, wa_id extracted from message
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        status: 'error',
        message: `WhatsApp ID already exists: ${phoneDigits}`,
      }),
    });

    // 4. findBySystemField(wa_id, ...) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 5. findBySystemField(whatsapp_phone, digits) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('TC-044: initial fallback (without +) resolves subscriber before createSubscriber is attempted', async () => {
    const to = '+85262875094';
    const phoneDigits = '85262875094';
    const subscriberId = '77776666';
    const termsUrl = 'https://example.com/terms?token=us019-noplusfallback';

    // 1. findBySystemField(whatsapp_phone, E.164) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 2. findBySystemField(whatsapp_phone, digits only) → found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });

    // 3. sendContent → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result).toBe(true);
    // Only 3 calls: 2 lookups + 1 sendContent (no createSubscriber needed)
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const fallbackBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(fallbackBody.field_name).toBe('whatsapp_phone');
    expect(fallbackBody.field_value).toBe(phoneDigits);
  });
});
