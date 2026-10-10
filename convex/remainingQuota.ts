import type { GenericDatabaseReader } from "convex/server";

import type { DataModel } from "./_generated/dataModel";

type QuotaSession = {
  session_id: string;
  quota_defined: number;
  quota_used: number;
};

/** Seats in a Session held by Customers who are paying right now. */
export async function heldSeats(
  db: GenericDatabaseReader<DataModel>,
  sessionId: string,
  now: number,
  excludeHoldId?: string
): Promise<number> {
  const holds = await db
    .query("seat_holds")
    .withIndex("by_session_status", (q) => q.eq("session_id", sessionId).eq("status", "held"))
    .collect();
  return holds
    .filter((hold) => hold.expires_at > now && hold.hold_id !== excludeHoldId)
    .reduce((sum, hold) => sum + hold.quantity, 0);
}

/**
 * A Session's Remaining Quota: its Quota less the Participants already in it and the
 * seats held by Customers who are paying. Every check of whether a Session has room
 * goes through here.
 */
export async function remainingQuota(
  db: GenericDatabaseReader<DataModel>,
  session: QuotaSession,
  options: { now?: number; excludeHoldId?: string } = {}
): Promise<number> {
  const held = await heldSeats(db, session.session_id, options.now ?? Date.now(), options.excludeHoldId);
  return Math.max(0, session.quota_defined - session.quota_used - held);
}

/** Remaining Quota for several Sessions at once, keyed by session_id. */
export async function remainingQuotaBySession(
  db: GenericDatabaseReader<DataModel>,
  sessions: QuotaSession[]
): Promise<Map<string, number>> {
  const now = Date.now();
  const entries = await Promise.all(
    sessions.map(async (session) => [session.session_id, await remainingQuota(db, session, { now })] as const)
  );
  return new Map(entries);
}
