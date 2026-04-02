import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendTermsAcceptanceWhatsApp } from '../../lib/manychat';

/**
 * TC-044 US-025: Handle ManyChat "WhatsApp ID already exists" error
 *
 * With the simplified US-025 flow, when createSubscriber returns 400
 * "already exists" and no stored subscriberId is available, the function
 * logs an error and returns { success: false, subscriberId: null }.
 *
 * The complex wa_id fallback chain (US-019) has been removed in favour of
 * the DB-backed subscriber ID cache (US-025).
 */
describe('TC-044 US-025 ManyChat already-exists error path (simplified)', () => {
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

  it('TC-044: returns false when createSubscriber returns 400 already-exists and no stored subscriberId', async () => {
    const to = '+85262875094';
    const termsUrl = 'https://example.com/terms?token=us019';

    // createSubscriber → 400 "WhatsApp ID already exists"
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        status: 'error',
        message: 'WhatsApp ID already exists',
        data: { wa_id: '85262875094' },
      }),
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result.success).toBe(false);
    expect(result.subscriberId).toBeNull();
    // Only 1 call: createSubscriber (no wa_id lookup fallback)
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('TC-044: when subscriberId provided (from DB cache), skips createSubscriber entirely', async () => {
    const to = '+85262875094';
    const subscriberId = '55551234';
    const termsUrl = 'https://example.com/terms?token=stored';

    // setCustomFields → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    // sendFlow → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl, subscriberId });

    expect(result.success).toBe(true);
    expect(result.subscriberId).toBe(subscriberId);
    // Only 2 calls: setCustomFields + sendFlow (no createSubscriber, no already-exists path)
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('TC-044: createSubscriber body uses whatsapp_phone and phone fields', async () => {
    const to = '+85262875094';
    const subscriberId = '77776666';
    const termsUrl = 'https://example.com/terms?token=us020-create-fields';

    // createSubscriber → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: subscriberId } }),
    });

    // setCustomFields → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    // sendFlow → success
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '{"status":"success"}',
    });

    const result = await sendTermsAcceptanceWhatsApp({ to, termsUrl });

    expect(result.success).toBe(true);
    expect(result.subscriberId).toBe(subscriberId);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Verify createSubscriber uses both whatsapp_phone and phone fields (US-020)
    const createBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(createBody.whatsapp_phone).toBe(to);
    expect(createBody.phone).toBe('85262875094'); // digits only, no +
    expect(createBody.has_opt_in_whatsapp).toBe(true);
  });
});
