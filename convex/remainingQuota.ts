import type { GenericDatabaseReader } from "convex/server";

import type { DataModel } from "./_generated/dataModel";

type QuotaSession = {
  session_id: string;
  quota_defined: number;
  quota_used: number;
};

/**
 * A Session's Remaining Quota: its Quota less the Participants already in it.
 * Every check of whether a Session has room goes through here.
 */
export async function remainingQuota(
  _db: GenericDatabaseReader<DataModel>,
  session: QuotaSession
): Promise<number> {
  return Math.max(0, session.quota_defined - session.quota_used);
}

/** Remaining Quota for several Sessions at once, keyed by session_id. */
export async function remainingQuotaBySession(
  db: GenericDatabaseReader<DataModel>,
  sessions: QuotaSession[]
): Promise<Map<string, number>> {
  const entries = await Promise.all(
    sessions.map(async (session) => [session.session_id, await remainingQuota(db, session)] as const)
  );
  return new Map(entries);
}
