---
status: accepted
---

# Participant credentials are public by design; the admin surface is not

Participants never log in. A Token (claims one Ticket) and a Participant Link (opens one
Participant's page) are themselves the credential: long, unguessable, and deliberately
reachable by anyone who holds them. So the participant-facing backend functions stay
public and authorise by possession of that secret. Admin functions are the opposite:
every admin mutation and query must authenticate the caller and check their role
itself, inside the backend, and never trust an admin identity passed in as an argument
or rely on a check in the Next.js layer.

## Considered Options

- **Backend authenticates everything**: rejected, because it would force a login onto
  the participant flow, which is loginless on purpose.
- **Only the Next.js server may reach the backend**: rejected, because client
  components call the backend directly by design, and participant pages need that.

## Consequences

- Participant-facing functions authorise by possession of a secret, so each one must
  be scoped to exactly what that secret should allow. Rescheduling authorised by a
  Participant Link must stay within that Participant's own Class and Change Cutoff.
- Test helpers that create or alter data are not part of the participant surface and
  must not be publicly callable in production.
