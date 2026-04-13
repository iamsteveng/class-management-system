import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so queryGeneric returns its definition object.
vi.mock('convex/server', () => ({
  queryGeneric: (def: any) => def,
  mutationGeneric: (def: any) => def,
  makeFunctionReference: (name: string) => name,
}));

// Mock convex/values — validators only need to not throw during module init.
vi.mock('convex/values', () => {
  const noop = (..._args: any[]): any => 'schema';
  const v = new Proxy({} as any, { get: () => noop });
  return { v };
});

import { getParticipantPageData } from '../../convex/participants';

describe('TC-042 US-013 getParticipantPageData returns height as number', () => {
  let handler: (ctx: any, args: any) => Promise<any>;
  let ctx: any;

  const mockParticipant = {
    _id: 'participant-doc-id',
    participant_id: 'participant-001',
    name: 'Test User',
    session_id: 'session-001',
    height: 170,
    age: 30,
    emergency_contact_name: 'Emergency Person',
    emergency_contact_phone: '+85291111111',
    qr_code_data: 'qr-data',
    purchase_id: 'purchase-id-1',
  };

  const mockSession = {
    _id: 'session-doc-id',
    session_id: 'session-001',
    class_id: 'class-001',
    date: '2099-12-01',
    time: '09:00',
    location_zh: 'Location ZH',
    location_en: 'Location EN',
    status: 'scheduled',
    quota_defined: 10,
    quota_used: 2,
  };

  const mockClass = {
    _id: 'class-doc-id',
    class_id: 'class-001',
    name_zh: 'Class ZH',
    name_en: 'Class EN',
    status: 'active',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    ctx = {
      db: {
        query: vi.fn().mockImplementation((table: string) => ({
          withIndex: vi.fn().mockReturnValue({
            first: vi.fn().mockImplementation(async () => {
              if (table === 'participants') return mockParticipant;
              if (table === 'sessions') return mockSession;
              if (table === 'classes') return mockClass;
              return null;
            }),
            collect: vi.fn().mockResolvedValue([]),
          }),
        })),
      },
    };

    handler = (getParticipantPageData as any).handler;
  });

  it('TC-042: height is returned as a number (not a string)', async () => {
    const result = await handler(ctx, { participant_id: 'participant-001' });

    expect(result).not.toBeNull();
    expect(typeof result.height).toBe('number');
    expect(result.height).toBe(170);
  });

  it('TC-042: age is returned as a number', async () => {
    const result = await handler(ctx, { participant_id: 'participant-001' });

    expect(result).not.toBeNull();
    expect(typeof result.age).toBe('number');
    expect(result.age).toBe(30);
  });
});
