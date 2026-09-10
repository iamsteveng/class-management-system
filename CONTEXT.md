# Class Management System

Sells and runs scheduled outdoor classes (cycling, guided tours). Customers buy seats
online, each seat holder accepts terms and becomes a participant, and admins run the
sessions and mark attendance.

## Language

### Offering

**Class**:
A kind of class that is sold and run repeatedly, e.g. 單車班, 導賞團. Carries the name,
description, price and whether it is currently on sale.
_Avoid_: Course, Product, 課程, 班別 (in admin contexts, 班級)

**Price**:
The amount charged for one Ticket, held only on the Class. What the Customer is shown is
always derived from it, never written separately. A Class with a Price of zero is free.
_Avoid_: Free class (as a separate kind of Class)
_Avoid_: Original price, Discount price (as separately stored figures)

**Group Price**:
A lower Price for a Class that applies when an Order holds at least a set minimum number
of Tickets.

**Session**:
One scheduled occurrence of a Class, identified by its location, date and time, with a
fixed quota of Participants. Bare "session" always means this. A Session is scheduled,
completed once it has taken place, or cancelled; a cancelled Session still holds its
Participants.
_Avoid_: Class, Timeslot, Occurrence, 班別 (use 時段)

**Quota**:
The number of Participants a Session can hold.

**Capacity**:
A Class's remaining room for new Tickets: the unused Quota summed across its scheduled
Sessions, less the Tickets already sold but not yet claimed. Cancelled Sessions
contribute nothing.

### Buying

**Order**:
One Customer's single act of buying, paid or free, covering one or more Tickets. An Order placed on
this site is always for one Class; an Order imported from an external seller may span
several Classes.
_Avoid_: Purchase, Transaction

**Ticket**:
One seat within an Order: the right for one person to attend one Session of the Class
that was bought. Exists from the moment of payment, before anyone is named. Never sold
beyond the Class's Capacity.
_Avoid_: Purchase, Seat, Slot, Pass

**Token**:
The secret identifying one Ticket, delivered to the Customer as a link so the seat can
be claimed without logging in. It claims the seat once; opened again afterwards, it
leads back to the Participant Link.
_Avoid_: Pass, Link, Application link, 報名連結 (these are UI copy for how a Token is delivered, not the thing itself)

**Refund**:
Returning one Ticket's Price to the Customer. It withdraws the Participant and never
erases them. A Refund that fails part-way is a recorded state, not an error message.

### People

**Customer**:
The person who placed an Order. Receives every message about money: confirmations,
receipts, refunds. Not necessarily someone who attends.
_Avoid_: Buyer, Client, Account

**Participant**:
A person attending one Session: the body at the class, with their own contact details,
height, age and emergency contact. Comes into existence when a Ticket's Token is
redeemed and the terms are accepted. Receives every message about their Session. The
Session a Participant holds is the only record of where they are currently booked.
_Avoid_: Attendee, Customer, User

**Withdrawn**:
A Participant whose Ticket was refunded. They keep their record and their Terms
Acceptance; they are no longer expected at the Session.

**Participant Link**:
The permanent, unguessable address of one Participant's own details page, which shows
their class details and attendance QR code. Distinct from a Token: a Token claims a
seat once, a Participant Link is theirs for good.

**Change Cutoff**:
The latest moment a Participant may move themselves to another Session of the same
Class: 00:00 Hong Kong time on the day two days before the Session (Thursday 00:00 for
a Saturday Session). Lifted when their Session is rain-cancelled. A Super Admin may move a
Participant past it, and must give a reason.

### Admins

**Admin Account**:
A shared login belonging to one admin role, not to a person. Admin actions are
attributable to an account, never to an individual.
_Avoid_: Admin user, Staff member

**Super Admin**:
The admin role that shapes the catalogue and moves money: Classes, Sessions, Prices,
Terms Versions, cancellations, Refunds, and overriding the Change Cutoff.

**Regular Admin**:
The admin role that runs the day: scanning Participants, viewing rosters and resending
messages.

**Admin Login**:
An authenticated Admin Account's browser session in the admin portal.
_Avoid_: Session

### Terms

**Terms Version**:
One immutable published revision of the terms and conditions. Exactly one is current at
a time; publishing a new one never alters an existing one.

**Terms Acceptance**:
One Participant agreeing to one Terms Version at a moment in time. It is an audit
record: what was agreed must remain provable, not merely referenced.

### At the class

**Scan**:
Evidence that a Participant was seen at a Session: which Admin Account scanned them,
and when. An append-only event, correctable but not silently rewritable.
_Avoid_: Attendance record

**Attendance**:
A Participant's derived state at a Session, read from their Scans together with the
Session's date and status. The absence of a Scan is not by itself absence: it may mean
absent, not yet scanned, or a Session that has not happened.
