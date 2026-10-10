---
status: accepted
---

# Admin calls are trusted only from our server, via a shared secret

Every Convex function is reachable by anyone who knows the deployment URL, which ships
in the site's JavaScript. Admin functions used to trust the `admin_username` they were
given, so anyone could act as a Super Admin by naming one. They now also require a
server secret that only our Next.js server holds; the server sends it after checking the
admin's login, and Convex refuses any admin call without it. The same secret guards the
checkout functions and the test helpers. This puts ADR 0001's rule ("the backend
authenticates every admin call itself") into practice without new infrastructure.

## Considered Options

- **Convex auth with a signed token per admin login**: the cleanest, since Convex would
  know which admin is calling rather than trusting our server to say so. Rejected for
  now as more setup (a token issuer, keys on both sides) for the same practical result,
  because every admin call already passes through our server.

## Consequences

- Convex trusts the server's word on which Admin Account is acting. Anyone holding the
  secret can act as any admin, so it lives only in server-side environment variables,
  never in code or the browser.
- End-to-end tests set up data by sending the dev secret; they cannot do so against prod.
- Participant-facing functions stay public and authorise by possession of a Token or
  Participant Link, as ADR 0001 says.
