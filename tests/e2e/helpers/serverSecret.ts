import { SERVER_ONLY_FUNCTIONS } from '../../../lib/serverOnlyFunctions';

/**
 * Test setup calls server-only Convex functions directly, the way our server does
 * (ADR 0003), so it needs the dev deployment's server secret: set CONVEX_SERVER_SECRET
 * in the environment when running the e2e tests. Prod's secret is never given to tests.
 */
export function withServerSecret(fnPath: string, args: Record<string, unknown>) {
  if (!SERVER_ONLY_FUNCTIONS.has(fnPath) || 'server_secret' in args) return args;
  const secret = process.env.CONVEX_SERVER_SECRET;
  if (!secret) throw new Error(`Set CONVEX_SERVER_SECRET (dev) to call ${fnPath} from tests.`);
  return { ...args, server_secret: secret };
}
