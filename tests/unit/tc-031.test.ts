import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so actionGeneric returns its definition object,
// allowing us to access .handler directly in tests.
vi.mock('convex/server', () => ({
  actionGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));

// Mock convex/values — validators only need to not throw during module init.
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  const v = new Proxy({} as any, { get: () => noop });
  return { v };
});

// Mock Twilio lib — sendWhatsApp will be overridden per-test
vi.mock('../../lib/twilio', () => ({
  sendWhatsApp: vi.fn(),
  getTwilioCredentialsFromConvexEnv: vi.fn().mockReturnValue(null),
}));

// Mock appBaseUrl lib
vi.mock('../../lib/appBaseUrl', () => ({
  resolveAppBaseUrl: vi.fn().mockReturnValue('https://example.com'),
  buildTermsUrl: vi.fn((_base: string, token: string) => `https://example.com/terms?token=${token}`),
}));

import { sendPurchaseConfirmation } from '../../convex/purchaseConfirmation';
import { sendWhatsApp } from '../../lib/twilio';

describe('TC-031 WhatsApp failure does not roll back purchase record', () => {
  let handler: (ctx: any, args: any) => Promise<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = (sendPurchaseConfirmation as any).handler;
  });

  it('TC-031: updatePurchaseStatus mutation is NOT called when sendWhatsApp throws — purchase stays at pending_terms', async () => {
    const purchaseId = 'purchases:tc031-purchase-001';
    const orderId = 'TC031-ORDER-001';

    // Simulate WhatsApp / Twilio failure
    const whatsappError = new Error('Twilio error: network failure sending WhatsApp');
    (sendWhatsApp as any).mockRejectedValue(whatsappError);

    // Purchase exists in pending_terms state (already committed by the prior mutation)
    const mockPurchase = {
      _id: purchaseId,
      order_id: orderId,
      status: 'pending_terms',
      customer_mobile: '+6591234567',
      token: 'terms-token-tc031-abc',
    };

    const runQueryMock = vi.fn().mockResolvedValue(mockPurchase);
    const runMutationMock = vi.fn();

    const ctx = {
      runQuery: runQueryMock,
      runMutation: runMutationMock,
    };

    // sendPurchaseConfirmation should propagate the WhatsApp error
    let caughtError: Error | null = null;
    try {
      await handler(ctx, { purchase_id: purchaseId });
    } catch (err) {
      caughtError = err as Error;
      // Caller would log the error with order_id for diagnostics
      console.error(`[purchaseConfirmation] WhatsApp failed for order_id=${orderId}: ${err}`);
    }

    // 1. The action threw (WhatsApp failure was not silently swallowed)
    expect(caughtError).not.toBeNull();
    expect(caughtError!.message).toContain('Twilio error');

    // 2. updatePurchaseStatus mutation was NEVER called
    //    → purchase record stays committed at status='pending_terms'
    //    → no rollback: the purchase was persisted by the prior applyS3CsvRows mutation
    expect(runMutationMock).not.toHaveBeenCalled();

    // 3. sendWhatsApp was called once (the failure point)
    expect(sendWhatsApp).toHaveBeenCalledTimes(1);
    expect(sendWhatsApp).toHaveBeenCalledWith(
      expect.objectContaining({ to: mockPurchase.customer_mobile })
    );
  });
});
