import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendTermsAcceptanceWhatsApp } from '../../lib/manychat';

/**
 * TC-045 US-025: ManyChat subscriber ID caching
 *
 * Verifies the US-025 DB-backed subscriber ID cache behaviour:
 * - Stored ID is used on repeat sends (no createSubscriber call)
 * - New ID is returned after createSubscriber so caller can persist it
 * - 400 already-exists logs error and returns false (no stored ID path)
 * - whatsapp_errors tracking is exercised via return values
 */
describe('TC-045 US-025 ManyChat subscriber ID caching', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.MANYCHAT_API_KEY = 'test-api-key-us025';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MANYCHAT_API_KEY;
  });

  it('TC-045: stored subscriberId used on repeat send — no createSubscriber call made', async () => {
    const to = '+85254304789';
    const termsUrl = 'https://example.com/terms?token=repeat';
    const storedSubscriberId = '111222333';

    // Only setCustomFields + sendFlow expected (no createSubscriber)
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '{"status":"success"}' });
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '{"status":"success"}' });

    const result = await sendTermsAcceptanceWhatsApp({
      to,
      termsUrl,
      subscriberId: storedSubscriberId,
    });

    expect(result.success).toBe(true);
    expect(result.subscriberId).toBe(storedSubscriberId);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Verify no createSubscriber call was made
    const callUrls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(callUrls.every((url) => !url.includes('createSubscriber'))).toBe(true);
  });

  it('TC-045: new subscriber ID returned after successful createSubscriber — caller can persist it', async () => {
    const to = '+85262875094';
    const termsUrl = 'https://example.com/terms?token=new-sub';
    const newSubscriberId = '999888777';

    // createSubscriber → success with new ID
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: newSubscriberId } }),
    });
    // setCustomFields → success
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '{"status":"success"}' });
    // sendFlow → success
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '{"status":"success"}' });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result.success).toBe(true);
    // subscriberId is returned so the caller can save it to the DB
    expect(result.subscriberId).toBe(newSubscriberId);
  });

  it('TC-045: 400 already-exists without stored ID logs error and returns false', async () => {
    const to = '+85262875094';
    const termsUrl = 'https://example.com/terms?token=already-exists';

    // createSubscriber → 400 already-exists
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        status: 'error',
        message: 'WhatsApp ID already exists',
      }),
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result.success).toBe(false);
    expect(result.subscriberId).toBeNull();
    // Exactly 1 API call — no fallback lookup chain
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('TC-045: whatsapp_errors incremented — sendFlow failure returns success=false', async () => {
    const to = '+85254304789';
    const termsUrl = 'https://example.com/terms?token=flow-fail';
    const subscriberId = '444555666';

    // setCustomFields → success
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '{"status":"success"}' });
    // sendFlow → failure
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl, subscriberId });

    // Caller would increment whatsapp_errors when result.success is false
    expect(result.success).toBe(false);
    expect(result.subscriberId).toBeNull();
  });

  it('TC-045: null subscriberId treated same as undefined — triggers createSubscriber', async () => {
    const to = '+85254304789';
    const termsUrl = 'https://example.com/terms?token=null-sub';
    const newSubscriberId = '123456789';

    // createSubscriber → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: newSubscriberId } }),
    });
    // setCustomFields → success
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '{"status":"success"}' });
    // sendFlow → success
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => '{"status":"success"}' });

    const result = await sendTermsAcceptanceWhatsApp({
      to,
      termsUrl,
      subscriberId: null,
    });

    expect(result.success).toBe(true);
    expect(result.subscriberId).toBe(newSubscriberId);
    // createSubscriber was called (3 total calls)
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect((fetchMock.mock.calls[0][0] as string)).toContain('createSubscriber');
  });
});
