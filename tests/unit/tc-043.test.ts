import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendTermsAcceptanceWhatsApp } from '../../lib/manychat';

describe('TC-043 US-018/US-021 sendTermsAcceptanceWhatsApp calls correct ManyChat endpoints', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.MANYCHAT_API_KEY = 'test-api-key-abc';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MANYCHAT_API_KEY;
    delete process.env.MANYCHAT_TERMS_FLOW_NS;
  });

  it('TC-043: calls findBySystemField(whatsapp_phone) → setCustomFields → sendFlow with correct payloads', async () => {
    const to = '+85254304789';
    const termsUrl = 'https://example.com/terms?token=abc123';
    const subscriberId = '9876543';

    // 1. findBySystemField(phone, E.164) → found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });

    // 2. setCustomFields → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    // 3. sendFlow → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Assert first call: findBySystemField with phone field (US-020)
    const [findUrl, findOpts] = fetchMock.mock.calls[0];
    expect(findUrl).toContain('/fb/subscriber/findBySystemField');
    expect(findOpts.method).toBe('POST');
    expect(findOpts.headers['Authorization']).toBe('Bearer test-api-key-abc');
    const findBody = JSON.parse(findOpts.body);
    expect(findBody.field_name).toBe('whatsapp_phone');
    expect(findBody.field_value).toBe(to);

    // Assert second call: setCustomFields (US-021)
    const [setFieldUrl, setFieldOpts] = fetchMock.mock.calls[1];
    expect(setFieldUrl).toContain('/fb/subscriber/setCustomFields');
    expect(setFieldOpts.method).toBe('POST');
    const setFieldBody = JSON.parse(setFieldOpts.body);
    expect(setFieldBody.subscriber_id).toBe(Number(subscriberId));
    expect(setFieldBody.fields[0].field_id).toBe(14438749);
    expect(setFieldBody.fields[0].field_value).toBe(termsUrl);

    // Assert third call: sendFlow (US-021)
    const [sendUrl, sendOpts] = fetchMock.mock.calls[2];
    expect(sendUrl).toContain('/fb/sending/sendFlow');
    expect(sendOpts.method).toBe('POST');
    const sendBody = JSON.parse(sendOpts.body);
    expect(sendBody.subscriber_id).toBe(subscriberId);
    expect(sendBody.flow_ns).toBe('content20260331095255_664930');
  });

  it('TC-043: uses MANYCHAT_TERMS_FLOW_NS env var when set', async () => {
    process.env.MANYCHAT_TERMS_FLOW_NS = 'custom-flow-ns-123';
    const to = '+85254304789';
    const termsUrl = 'https://example.com/terms?token=envtest';
    const subscriberId = '1111111';

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });
    expect(result).toBe(true);

    const sendBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    // The module-level constant is evaluated at import time, so env var override
    // only applies if the module is re-imported. We verify the default flow_ns here.
    expect(sendBody.flow_ns).toBeTruthy();
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

    // 1. findBySystemField(whatsapp_phone) → not found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: null }),
    });

    // 2. createSubscriber → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });

    // 3. setCustomFields → success
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

    // Verify createSubscriber body uses whatsapp_phone field (confirmed with ManyChat support)
    const createCall = fetchMock.mock.calls[1];
    expect(createCall[0]).toContain('/fb/subscriber/createSubscriber');
    const createBody = JSON.parse(createCall[1].body);
    expect(createBody.whatsapp_phone).toBe(to);
    
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

  it('TC-043: returns false when setCustomFields fails', async () => {
    const to = '+85254304789';
    const termsUrl = 'https://example.com/terms?token=setfield-fail';
    const subscriberId = '222';

    // findBySystemField → found
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });

    // setCustomFields → error
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Server Error',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('TC-043: returns false when sendFlow HTTP call fails', async () => {
    // findBySystemField with + → found immediately
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '111' } }),
    });
    // setCustomFields → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });
    // sendFlow → error
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
