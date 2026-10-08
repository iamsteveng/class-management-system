import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock convex/server so queryGeneric/mutationGeneric return their definition objects.
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

import { getAvailableSessionsByClass, listClassesOnSale } from '../../convex/homepage';
import { acceptTermsByToken, getTermsPageData } from '../../convex/terms';
import { changeParticipantSession, getParticipantPageData } from '../../convex/participants';
import {
  changeParticipantSession as adminChangeParticipantSession,
  getAvailableSessionsForClassChange,
} from '../../convex/adminParticipants';
import { setSessionHidden } from '../../convex/adminSessions';

const handler = (fn: unknown) => (fn as { handler: (ctx: any, args: any) => Promise<any> }).handler;

/** Minimal in-memory stand-in for ctx.db: index lookups and filters match on field equality. */
function makeDb(tables: Record<string, any[]>) {
  const matcher = () => {
    const conditions: Array<[string, unknown]> = [];
    const q: any = {
      field: (name: string) => ({ field: name }),
      eq: (left: any, value: unknown) => {
        conditions.push([typeof left === 'string' ? left : left.field, value]);
        return q;
      },
    };
    return { q, matches: (doc: any) => conditions.every(([field, value]) => doc[field] === value) };
  };

  const query = (table: string) => {
    let rows = [...(tables[table] ?? [])];
    const chain: any = {
      withIndex: (_name: string, build?: (q: any) => any) => {
        if (build) {
          const { q, matches } = matcher();
          build(q);
          rows = rows.filter(matches);
        }
        return chain;
      },
      filter: (build: (q: any) => any) => {
        const { q, matches } = matcher();
        build(q);
        rows = rows.filter(matches);
        return chain;
      },
      first: async () => rows[0] ?? null,
      collect: async () => rows,
    };
    return chain;
  };

  const all = () => Object.values(tables).flat();
  return {
    query: vi.fn(query),
    get: vi.fn(async (id: string) => all().find((doc) => doc._id === id) ?? null),
    patch: vi.fn(async (id: string, fields: Record<string, unknown>) => {
      Object.assign(all().find((doc) => doc._id === id), fields);
    }),
    insert: vi.fn(async (table: string, doc: any) => {
      (tables[table] ??= []).push(doc);
      return `${table}-new`;
    }),
  };
}

const futureDate = '2099-06-01';

function session(overrides: Record<string, unknown>) {
  return {
    class_id: 'class-1',
    location_zh: 'Studio',
    date: futureDate,
    time: '10:00',
    quota_defined: 10,
    quota_used: 0,
    status: 'scheduled',
    ...overrides,
  };
}

let tables: Record<string, any[]>;
let ctx: any;

beforeEach(() => {
  tables = {
    classes: [{ _id: 'c1', class_id: 'class-1', name_zh: 'Class', status: 'active', is_free: true, created_at: 1 }],
    sessions: [
      session({ _id: 's-current', session_id: 'current', date: '2099-05-01' }),
      session({ _id: 's-visible', session_id: 'visible' }),
      session({ _id: 's-hidden', session_id: 'hidden', hidden: true }),
    ],
    participants: [{ _id: 'p1', participant_id: 'participant-1', session_id: 'current', purchase_id: 'pur1' }],
    purchases: [
      {
        _id: 'pur1',
        token: 'token-1',
        order_id: 'order-1',
        class_id: 'class-1',
        customer_mobile: '+85291234567',
        participant_count: 1,
        status: 'pending_terms',
      },
    ],
    terms_versions: [{ _id: 't1', version: 'v1', content: 'Terms', is_current: true }],
    admins: [
      { _id: 'a-super', username: 'admin', role: 'super_admin' },
      { _id: 'a-regular', username: 'staff', role: 'regular_admin' },
    ],
    audit_logs: [],
  };
  ctx = { db: makeDb(tables), scheduler: { runAfter: vi.fn() } };
});

describe('TC-078 Hidden Sessions are not shown to or selectable by Customers and Participants', () => {
  it('TC-078: the class list API and the single-Class sessions API omit Hidden Sessions', async () => {
    const classes = await handler(listClassesOnSale)(ctx, {});
    expect(classes[0].sessions.map((s: any) => s.session_id)).toEqual(['current', 'visible']);

    const sessions = await handler(getAvailableSessionsByClass)(ctx, { class_id: 'class-1' });
    expect(sessions.map((s: any) => s.session_id)).toEqual(['current', 'visible']);
  });

  it('TC-078: the terms form does not offer a Hidden Session', async () => {
    const page = await handler(getTermsPageData)(ctx, { token: 'token-1' });
    expect(page.sessions.map((s: any) => s.session_id)).not.toContain('hidden');
    expect(page.sessions.map((s: any) => s.session_id)).toContain('visible');
  });

  it('TC-078: accepting terms into a Hidden Session is refused', async () => {
    const result = await handler(acceptTermsByToken)(ctx, {
      token: 'token-1',
      session_id: 'hidden',
      accepted: true,
      name: 'Test',
      participant_mobile: '+85291234567',
    });
    expect(result).toEqual({ success: false, error_message: 'Selected session is not available.' });
  });

  it('TC-078: self-service Change Session neither offers nor accepts a Hidden Session', async () => {
    const page = await handler(getParticipantPageData)(ctx, { participant_id: 'participant-1' });
    expect(page.session_options.map((s: any) => s.session_id)).toEqual(['visible']);

    const result = await handler(changeParticipantSession)(ctx, {
      participant_id: 'participant-1',
      session_id: 'hidden',
    });
    expect(result).toEqual({ success: false, error_message: 'Selected session is not available.' });
    expect(tables.participants[0].session_id).toBe('current');
  });

  it('TC-078: a Participant can still move out of a Hidden Session', async () => {
    tables.participants[0].session_id = 'hidden';
    const result = await handler(changeParticipantSession)(ctx, {
      participant_id: 'participant-1',
      session_id: 'visible',
    });
    expect(result).toEqual({ success: true });
    expect(tables.participants[0].session_id).toBe('visible');
  });
});

describe('TC-078 admins still see and use Hidden Sessions', () => {
  it('TC-078: the admin move list includes Hidden Sessions, flagged', async () => {
    const options = await handler(getAvailableSessionsForClassChange)(ctx, {
      class_id: 'class-1',
      current_session_id: 'current',
    });
    expect(options.map((s: any) => [s.session_id, s.hidden])).toEqual([
      ['visible', false],
      ['hidden', true],
    ]);
  });

  it('TC-078: a Super Admin can move a Participant into a Hidden Session', async () => {
    const result = await handler(adminChangeParticipantSession)(ctx, {
      participant_id: 'participant-1',
      session_id: 'hidden',
      admin_username: 'admin',
    });
    expect(result).toEqual({ success: true });
    expect(tables.participants[0].session_id).toBe('hidden');
    expect(tables.audit_logs.find((log) => log.action === 'participant_session_changed').admin_id).toBe('a-super');
  });

  it('TC-078: a Regular Admin cannot use the admin move', async () => {
    const result = await handler(adminChangeParticipantSession)(ctx, {
      participant_id: 'participant-1',
      session_id: 'hidden',
      admin_username: 'staff',
    });
    expect(result.success).toBe(false);
    expect(tables.participants[0].session_id).toBe('current');
  });
});

describe('TC-078 setSessionHidden', () => {
  it('TC-078: a Super Admin hides and shows a scheduled Session, with audit logs', async () => {
    await handler(setSessionHidden)(ctx, { session_id: 'visible', hidden: true, admin_username: 'admin' });
    expect(tables.sessions[1].hidden).toBe(true);

    await handler(setSessionHidden)(ctx, { session_id: 'visible', hidden: false, admin_username: 'admin' });
    expect(tables.sessions[1].hidden).toBe(false);

    expect(tables.audit_logs.map((log) => log.action)).toEqual(['session_hidden', 'session_shown']);
  });

  it('TC-078: a Regular Admin cannot hide a Session', async () => {
    await expect(
      handler(setSessionHidden)(ctx, { session_id: 'visible', hidden: true, admin_username: 'staff' })
    ).rejects.toThrow('Only super admins');
    expect(tables.sessions[1].hidden).toBeUndefined();
  });

  it('TC-078: only scheduled Sessions can be hidden', async () => {
    tables.sessions[1].status = 'cancelled';
    await expect(
      handler(setSessionHidden)(ctx, { session_id: 'visible', hidden: true, admin_username: 'admin' })
    ).rejects.toThrow('Only scheduled sessions');
  });
});
