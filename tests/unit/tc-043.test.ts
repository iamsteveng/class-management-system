import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendTermsAcceptanceWhatsApp } from '../../lib/manychat';

describe('TC-043 US-018 sendTermsAcceptanceWhatsApp calls correct ManyChat endpoints', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.MANYCHAT_API_KEY = 'test-api-key-abc';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MANYCHAT_API_KEY;
  });

  it('TC-043: calls findBySystemField with phone field then sendContent with correct payload', async () => {
    const to = '+85254304789';
    const termsUrl = 'https://example.com/terms?token=abc123';
    const subscriberId = '9876543';

    // First call: findBySystemField (phone field, E.164 with +) → returns subscriber
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });

    // Second call: sendContent → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Assert first call: findBySystemField with phone field (US-020)
    const [findUrl, findOpts] = fetchMock.mock.calls[0];
    expect(findUrl).toContain('/fb/subscriber/findBySystemField');
    expect(findOpts.method).toBe('POST');
    expect(findOpts.headers['Authorization']).toBe('Bearer test-api-key-abc');
    const findBody = JSON.parse(findOpts.body);
    expect(findBody.field_name).toBe('phone');
    expect(findBody.field_value).toBe(to);

    // Assert second call: sendContent
    const [sendUrl, sendOpts] = fetchMock.mock.calls[1];
    expect(sendUrl).toContain('/fb/sending/sendContent');
    expect(sendOpts.method).toBe('POST');
    expect(sendOpts.headers['Authorization']).toBe('Bearer test-api-key-abc');
    const sendBody = JSON.parse(sendOpts.body);
    expect(sendBody.subscriber_id).toBe(subscriberId);
    expect(sendBody.custom_fields['cuf_14438749']).toBe(termsUrl);
    // Template name should be present in the message
    expect(JSON.stringify(sendBody)).toContain('Terms acceptance');
  });

  it('TC-043: returns false when all subscriber lookup paths fail', async () => {
    // 1. findBySystemField(phone, +phone) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });
    // 2. createSubscriber → fails (non-already-exists error)
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ status: 'error', message: 'Internal server error' }),
    });

    const result = await sendTermsAcceptanceWhatsApp({
      to: '+85200000000',
      termsUrl: 'https://example.com/terms?token=xyz',
    });

    expect(result).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('TC-043: createSubscriber includes phone field alongside whatsapp_phone (US-020)', async () => {
    const to = '+85254304789';
    const termsUrl = 'https://example.com/terms?token=create-test';
    const subscriberId = '1234567';

    // 1. findBySystemField(phone) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 2. createSubscriber → success
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
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Verify createSubscriber body includes both phone and whatsapp_phone
    const createCall = fetchMock.mock.calls[1];
    expect(createCall[0]).toContain('/fb/subscriber/createSubscriber');
    const createBody = JSON.parse(createCall[1].body);
    expect(createBody.whatsapp_phone).toBe(to);
    expect(createBody.phone).toBe(to);
  });

  it('TC-043: returns false when MANYCHAT_API_KEY is missing', async () => {
    delete process.env.MANYCHAT_API_KEY;

    const result = await sendTermsAcceptanceWhatsApp({
      to: '+85200000001',
      termsUrl: 'https://example.com/terms?token=xyz',
    });

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('TC-043: returns false when sendContent HTTP call fails', async () => {
    // findBySystemField with + → found immediately
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '111' } }),
    });
    // sendContent → error
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const result = await sendTermsAcceptanceWhatsApp({
      to: '+85200000002',
      termsUrl: 'https://example.com/terms?token=fail',
    });

    expect(result).toBe(false);
  });
});
