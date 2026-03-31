import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendTermsAcceptanceWhatsApp } from '../../lib/manychat';

/**
 * TC-044 US-019: Handle ManyChat "WhatsApp ID already exists" error
 *
 * When createSubscriber returns HTTP 400 "WhatsApp ID already exists",
 * the function must extract wa_id from the error body and retry
 * findBySystemField lookups before giving up.
 *
 * US-021: after resolving subscriber ID, sends via setCustomFieldByName + sendFlow.
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

    // 1. findBySystemField(phone, E.164) → not found (US-020: uses phone field)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 2. createSubscriber → 400 "WhatsApp ID already exists" with wa_id in data
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        status: 'error',
        message: 'WhatsApp ID already exists',
        data: { wa_id: waId },
      }),
    });

    // 3. findBySystemField(wa_id, waId) → found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });

    // 4. setCustomFieldByName → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    // 5. sendFlow → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(5);

    // Verify initial lookup used phone field (US-020)
    const initialCall = fetchMock.mock.calls[0];
    const initialBody = JSON.parse(initialCall[1].body);
    expect(initialBody.field_name).toBe('phone');

    // Verify wa_id lookup was attempted
    const waIdCall = fetchMock.mock.calls[2];
    const waIdBody = JSON.parse(waIdCall[1].body);
    expect(waIdBody.field_name).toBe('wa_id');
    expect(waIdBody.field_value).toBe(phoneDigits); // no + prefix

    // Verify setCustomFieldByName called with correct args (US-021)
    const setFieldCall = fetchMock.mock.calls[3];
    expect(setFieldCall[0]).toContain('/fb/subscriber/setCustomFieldByName');
    const setFieldBody = JSON.parse(setFieldCall[1].body);
    expect(setFieldBody.subscriber_id).toBe(subscriberId);
    expect(setFieldBody.field_name).toBe('cuf_14438749');
    expect(setFieldBody.field_value).toBe(termsUrl);

    // Verify sendFlow used the resolved subscriber ID (US-021)
    const sendCall = fetchMock.mock.calls[4];
    expect(sendCall[0]).toContain('/fb/sending/sendFlow');
    const sendBody = JSON.parse(sendCall[1].body);
    expect(sendBody.subscriber_id).toBe(subscriberId);
    expect(sendBody.flow_ns).toBe('content20260331095255_664930');
  });

  it('TC-044: falls back to whatsapp_phone (no +) lookup when wa_id lookup fails', async () => {
    const to = '+85262875094';
    const phoneDigits = '85262875094';
    const subscriberId = '99998888';
    const termsUrl = 'https://example.com/terms?token=us019-fallback';

    // 1. findBySystemField(phone, +phone) → not found (US-020: uses phone field)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 2. createSubscriber → 400 already-exists, wa_id in details field
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        status: 'error',
        message: 'WhatsApp ID already exists',
        details: { wa_id: phoneDigits },
      }),
    });

    // 3. findBySystemField(wa_id, ...) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 4. findBySystemField(whatsapp_phone, digits) → found (final fallback)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });

    // 5. setCustomFieldByName → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    // 6. sendFlow → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(6);

    // Final fallback should be whatsapp_phone with digits only
    const fallbackBody = JSON.parse(fetchMock.mock.calls[3][1].body);
    expect(fallbackBody.field_name).toBe('whatsapp_phone');
    expect(fallbackBody.field_value).toBe(phoneDigits);
  });

  it('TC-044: returns false when already-exists and all subsequent lookups fail', async () => {
    const to = '+85262875094';
    const phoneDigits = '85262875094';
    const termsUrl = 'https://example.com/terms?token=us019-allfail';

    // 1. findBySystemField(phone, +phone) → not found (US-020: uses phone field)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 2. createSubscriber → 400 already-exists, wa_id extracted from message
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        status: 'error',
        message: `WhatsApp ID already exists: ${phoneDigits}`,
      }),
    });

    // 3. findBySystemField(wa_id, ...) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 4. findBySystemField(whatsapp_phone, digits) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('TC-044: createSubscriber body includes both phone and whatsapp_phone fields (US-020)', async () => {
    const to = '+85262875094';
    const subscriberId = '77776666';
    const termsUrl = 'https://example.com/terms?token=us020-create-fields';

    // 1. findBySystemField(phone, +phone) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 2. createSubscriber → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });

    // 3. setCustomFieldByName → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    // 4. sendFlow → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    // Verify createSubscriber includes both phone and whatsapp_phone (US-020)
    const createBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(createBody.phone).toBe(to);
    expect(createBody.whatsapp_phone).toBe(to);
  });
});
