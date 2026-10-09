import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import { SERVER_ONLY_FUNCTIONS } from '../../lib/serverOnlyFunctions';

// The server's Convex client attaches the server secret to the functions in
// SERVER_ONLY_FUNCTIONS (ADR 0003). That list must match what convex/ declares.

const convexDir = path.join(__dirname, '../../convex');

function declared(kind: RegExp) {
  const names: string[] = [];
  for (const file of fs.readdirSync(convexDir).filter((f) => f.endsWith('.ts'))) {
    const source = fs.readFileSync(path.join(convexDir, file), 'utf8');
    for (const m of source.matchAll(new RegExp(`export const (\\w+) = (${kind.source})\\(`, 'g'))) {
      names.push(`${file.replace(/\.ts$/, '')}:${m[1]}`);
    }
  }
  return names.sort();
}

describe('server-only Convex functions', () => {
  it('lists exactly the functions declared with serverQuery / serverMutation / serverAction', () => {
    expect([...SERVER_ONLY_FUNCTIONS].sort()).toEqual(declared(/server(?:Query|Mutation|Action)/));
  });

  it('leaves every admin function server-only', () => {
    const adminModules = ['adminClasses', 'adminParticipants', 'adminPurchases', 'adminSessions', 'adminTerms', 'adminVenues', 'purchaseRefundDb', 'testPurchase'];
    const publicAdmin = declared(/queryGeneric|mutationGeneric|actionGeneric/).filter((n) =>
      adminModules.includes(n.split(':')[0])
    );
    expect(publicAdmin).toEqual([]);
  });
});
