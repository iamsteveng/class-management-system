import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so mutationGeneric returns its definition object,
// allowing us to access .handler directly in tests.
vi.mock('convex/server', () => ({
  mutationGeneric: (def: any) => def,
  queryGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));

// Mock convex/values — validators only need to not throw during module init.
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  const v = new Proxy({} as any, { get: () => noop });
  return { v };
});

import { acceptTermsByToken } from '../../convex/terms';

describe('TC-041 US-012 height is stored as a number in participants table', () => {
  let handler: (ctx: any, args: any) => Promise<any>;
  let insertedParticipant: any;
  let ctx: any;

  beforeEach(() => {
    vi.clearAllMocks();

    insertedParticipant = null;

    ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            first: vi.fn(),
          }),
        }),
        patch: vi.fn().mockResolvedValue(undefined),
        insert: vi.fn().mockImplementation(async (table: string, doc: any) => {
          if (table === 'participants') {
            insertedParticipant = doc;
          }
          return 'mock-id';
        }),
      },
      scheduler: {
        runAfter: vi.fn().mockResolvedValue(undefined),
      },
    };

    handler = (acceptTermsByToken as any).handler;
  });

  it('TC-041: height is stored as a number (not a string) in the participants table', async () => {
    const mockPurchase = {
      _id: 'purchase-id-1',
      token: 'test-token',
      status: 'pending_terms',
      customer_mobile: '+85290000001',
      participant_count: 1,
      order_id: 'ORD-041',
    };

    const mockSession = {
      _id: 'session-id-1',
      session_id: 'session-001',
      class_id: 'class-001',
      status: 'scheduled',
      quota_defined: 10,
      quota_used: 0,
    };

    const mockTerms = {
      _id: 'terms-id-1',
      version: '1.0',
      content: 'Terms content',
      is_current: true,
    };

    const mockClass = {
      _id: 'class-id-1',
      class_id: 'class-001',
      name_zh: '單車班',
    };

    // Return the mock document for whichever table is queried
    const docsByTable: Record<string, unknown> = {
      purchases: mockPurchase,
      sessions: mockSession,
      classes: mockClass,
      terms_versions: mockTerms,
    };
    ctx.db.query.mockImplementation((table: string) => ({
      withIndex: () => ({
        first: async () => docsByTable[table] ?? null,
        collect: async () => [],
      }),
    }));

    const result = await handler(ctx, {
      token: 'test-token',
      session_id: 'session-001',
      accepted: true,
      name: 'Test Participant',
      participant_mobile: '+85290000001',
      height: 170,
      age: 30,
      email: 'test@example.com',
    });

    expect(result.success).toBe(true);
    expect(insertedParticipant).not.toBeNull();
    expect(typeof insertedParticipant.height).toBe('number');
    expect(insertedParticipant.height).toBe(170);
  });
});
