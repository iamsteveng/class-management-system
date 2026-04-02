import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendTermsAcceptanceWhatsApp } from '../../lib/manychat';

/**
 * TC-043 US-025 sendTermsAcceptanceWhatsApp simplified flow
 *
 * The simplified flow (US-025):
 * 1. If subscriberId provided → use it directly (no createSubscriber)
 * 2. If not provided → call createSubscriber
 * 3. setCustomFields → sendFlow
 * Returns { success, subscriberId }
 */
describe('TC-043 US-025 sendTermsAcceptanceWhatsApp simplified flow', () => {
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

  it('TC-043: when subscriberId provided, uses it directly (no createSubscriber call)', async () => {
    const to = '+85254304789';
    const termsUrl = 'https://example.com/terms?token=abc123';
    const subscriberId = '9876543';

    // 1. setCustomFields → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    // 2. sendFlow → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl, subscriberId });

    expect(result.success).toBe(true);
    expect(result.subscriberId).toBe(subscriberId);
    // Only 2 calls: setCustomFields + sendFlow (no createSubscriber)
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Assert first call: setCustomFields (US-021)
    const [setFieldUrl, setFieldOpts] = fetchMock.mock.calls[0];
    expect(setFieldUrl).toContain('/fb/subscriber/setCustomFields');
    expect(setFieldOpts.method).toBe('POST');
    expect(setFieldOpts.headers['Authorization']).toBe('Bearer test-api-key-abc');
    const setFieldBody = JSON.parse(setFieldOpts.body);
    expect(setFieldBody.subscriber_id).toBe(Number(subscriberId));
    expect(setFieldBody.fields[0].field_id).toBe(14438749);
    expect(setFieldBody.fields[0].field_value).toBe(termsUrl);

    // Assert second call: sendFlow (US-021)
    const [sendUrl, sendOpts] = fetchMock.mock.calls[1];
    expect(sendUrl).toContain('/fb/sending/sendFlow');
    expect(sendOpts.method).toBe('POST');
    const sendBody = JSON.parse(sendOpts.body);
    expect(sendBody.subscriber_id).toBe(subscriberId);
    expect(sendBody.flow_ns).toBe('content20260331095255_664930');
  });

  it('TC-043: when no subscriberId, calls createSubscriber then setCustomFields + sendFlow', async () => {
    const to = '+85254304789';
    const termsUrl = 'https://example.com/terms?token=create-test';
    const newSubscriberId = '1234567';

    // 1. createSubscriber → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: newSubscriberId } }),
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

    expect(result.success).toBe(true);
    expect(result.subscriberId).toBe(newSubscriberId);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Verify createSubscriber body
    const createCall = fetchMock.mock.calls[0];
    expect(createCall[0]).toContain('/fb/subscriber/createSubscriber');
    const createBody = JSON.parse(createCall[1].body);
    expect(createBody.whatsapp_phone).toBe(to);
    expect(createBody.phone).toBe('85254304789'); // without +
    expect(createBody.has_opt_in_whatsapp).toBe(true);
  });

  it('TC-043: returns false when MANYCHAT_API_KEY is missing', async () => {
    delete process.env.MANYCHAT_API_KEY;

    const result = await sendTermsAcceptanceWhatsApp({
      to: '+85200000001',
      termsUrl: 'https://example.com/terms?token=xyz',
    });

    expect(result.success).toBe(false);
    expect(result.subscriberId).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('TC-043: returns false when setCustomFields fails', async () => {
    const to = '+85254304789';
    const termsUrl = 'https://example.com/terms?token=setfield-fail';
    const subscriberId = '222';

    // setCustomFields → error
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Server Error',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl, subscriberId });

    expect(result.success).toBe(false);
    expect(result.subscriberId).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('TC-043: returns false when sendFlow HTTP call fails', async () => {
    const subscriberId = '111';
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
      subscriberId,
    });

    expect(result.success).toBe(false);
    expect(result.subscriberId).toBeNull();
  });

  it('TC-043: returns false when createSubscriber fails with non-already-exists error', async () => {
    // createSubscriber → fails (server error)
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ status: 'error', message: 'Internal server error' }),
    });

    const result = await sendTermsAcceptanceWhatsApp({
      to: '+85200000000',
      termsUrl: 'https://example.com/terms?token=xyz',
    });

    expect(result.success).toBe(false);
    expect(result.subscriberId).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
