import { vi } from 'vitest';

/** Minimal in-memory stand-in for ctx.db: index lookups and filters match on simple comparisons. */
export function makeDb(tables: Record<string, any[]>) {
  let nextId = 0;
  const matcher = () => {
    const conditions: Array<(doc: any) => boolean> = [];
    const read = (doc: any, x: any) => (x && typeof x === 'object' && 'field' in x ? doc[x.field] : x);
    const left = (l: any) => (typeof l === 'string' ? { field: l } : l);
    const cmp = (test: (a: any, b: any) => boolean) => (l: any, r: unknown) => {
      conditions.push((d) => test(read(d, left(l)), read(d, r)));
      return q;
    };
    const q: any = {
      field: (name: string) => ({ field: name }),
      eq: cmp((a, b) => a === b),
      neq: cmp((a, b) => a !== b),
      gt: cmp((a, b) => a > b),
      gte: cmp((a, b) => a >= b),
      lt: cmp((a, b) => a < b),
      lte: cmp((a, b) => a <= b),
      and: () => q,
    };
    return { q, matches: (doc: any) => conditions.every((c) => c(doc)) };
  };

  const query = (table: string) => {
    let rows = [...(tables[table] ?? [])];
    const narrow = (build?: (q: any) => any) => {
      if (build) {
        const { q, matches } = matcher();
        build(q);
        rows = rows.filter(matches);
      }
      return chain;
    };
    const chain: any = {
      withIndex: (_name: string, build?: (q: any) => any) => narrow(build),
      filter: (build: (q: any) => any) => narrow(build),
      order: () => chain,
      first: async () => rows[0] ?? null,
      unique: async () => rows[0] ?? null,
      collect: async () => rows,
      take: async (n: number) => rows.slice(0, n),
    };
    return chain;
  };

  const all = () => Object.values(tables).flat();
  return {
    tables,
    query: vi.fn(query),
    get: vi.fn(async (id: string) => all().find((doc) => doc._id === id) ?? null),
    patch: vi.fn(async (id: string, fields: Record<string, unknown>) => {
      Object.assign(all().find((doc) => doc._id === id), fields);
    }),
    insert: vi.fn(async (table: string, doc: any) => {
      const _id = `${table}-${++nextId}`;
      (tables[table] ??= []).push({ _id, ...doc });
      return _id;
    }),
    delete: vi.fn(async (id: string) => {
      for (const rows of Object.values(tables)) {
        const i = rows.findIndex((d) => d._id === id);
        if (i >= 0) rows.splice(i, 1);
      }
    }),
  };
}

/** A Convex function's handler, called the way our server calls it (with the server secret). */
export const handler = (fn: unknown) => (ctx: any, args: any) =>
  (fn as { handler: (ctx: any, args: any) => Promise<any> }).handler(ctx, {
    server_secret: process.env.CONVEX_SERVER_SECRET,
    ...args,
  });
