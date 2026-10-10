import { describe, it, expect } from 'vitest';

import { buildParticipantPassUrl } from '../../lib/appBaseUrl';
import { extractParticipantId } from '../../lib/attendanceQrPayload';

const ID = '3f2b8c1e-5d6a-4e7f-9a0b-1c2d3e4f5a6b';

describe('scanning Attendance QRs', () => {
  it('reads QRs issued before the revamp that hold the bare participant ID', () => {
    expect(extractParticipantId(ID)).toBe(ID);
    expect(extractParticipantId(`  ${ID}\n`)).toBe(ID);
  });

  it('reads QRs that hold the Participant Link, whichever domain issued them', () => {
    expect(extractParticipantId(buildParticipantPassUrl('https://class-management-system-teal.vercel.app', ID))).toBe(ID);
    expect(extractParticipantId(`https://preview-abc.vercel.app/participant/${ID}?status=x`)).toBe(ID);
  });

  it('reads the QR the new apply flow issues', () => {
    // The done page and the participant page build the QR from buildParticipantPassUrl.
    expect(extractParticipantId(buildParticipantPassUrl('https://example.com', ID))).toBe(ID);
  });

  it('ignores an empty scan', () => {
    expect(extractParticipantId('   ')).toBeNull();
  });
});
