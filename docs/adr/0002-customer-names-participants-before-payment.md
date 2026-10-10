---
status: accepted
---

# The Customer names every Participant and accepts the terms before paying

Customers used to pay for Tickets to a Class, then each attendee redeemed a Token from
WhatsApp to choose a Session, fill in their own details and accept the terms. Seats were
only taken at redemption, so a Session could fill up after someone had paid. Now the
Customer chooses the Session, names each Participant, and accepts the terms on their
behalf, all before paying. A Seat Hold keeps the chosen seats while the payment goes
through, and the Order's Tickets and Participants are created together once it is paid.
We accepted that one person now vouches for everyone else in return for a single,
shorter flow in which a paid seat is always a seated one.

## Considered Options

- **Pay first, each attendee redeems a Token (the old flow)**: rejected because of the
  seats lost after payment and the drop-off between paying and redeeming.
- **Details before payment, then each adult confirms by link**: rejected because it
  brings back the redemption step for most Orders.

## Consequences

- Two paths exist side by side. Legacy Tickets keep their Token and the terms page
  until they are redeemed; new Orders never get a Token.
- Each Terms Acceptance records whether the Participant accepted themselves or the
  Customer accepted for them.
- Attendance QRs still encode the Participant Link, so QRs issued before this change
  keep scanning.
- Unredeemed Legacy Tickets no longer reserve any Quota. Admins resolve a holder left
  without a seat by Refund or by moving them into a Hidden Session.
