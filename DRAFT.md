## Tech stack

- Frontend: Next.js, hosting in [Vercel.com](http://Vercel.com)
- CSS framework: Tailwind
- Backend: Node.js, hosting in [Convex.dev](http://Convex.dev)
- Database: [Convex.dev](http://Convex.dev)
- Cron jobs: [Convex.dev](http://Convex.dev)
- File storage: [Convex.dev](http://Convex.dev)
- Whatsapp message delivery: Twilio

## Consumer User Flow

- Get purchase records and customer information from csv files in file storage every one minute. Each purchase record has order id, customer mobile number, purchase date time.
- One purchase record may represent more than one participants.

- Auto send confirmation WhatsApp message to customers. It contains a link to a terms acceptance form.
- The form does not require user login, but need to identify the unique customer and the class he purchased.
- The form requires customers to select a session (with available quota) of the purchased class, acknowledge and accept the terms. System need to store the content he accepted for record purpose.
- After finishing the form, system will send a confirmation WhatsApp message with a link that opens a participant details page. If the purchase record have two participants, two links will be included.
- It shows his personal info and class details and a QR code for admin to confirm his participation during class.
- He can change to another session of the same class two days before the session date on the participation details page.
- The participant details page doesn’t require user login , because each participant is identified by a long id which is always unique by design.

## Admin Portal

- Admin can login to a admin portal by his username and password.
- All the actions performed by admin need to record the admin username for audit trail purpose.
- Add, edit or cancel sessions of a class.
- Each session is identified by location, date, time.
- Each session has quota of participants. Display how many quota is defined, how many is used and available. If all the quota is filled up, the session cannot accept new participants.
- Add, edit or cancel class, eg 單車班, 導賞團.
- List all the participants in a selected session.
- For each participant, admin can see his session, see whether he has accepted terms, see the terms content that is accepted. Admin can change the session to another session under the same class.
- If the session of a participant is updated, system will send a WhatsApp message to notify the customer.
- Update and create a new version of the terms, such that new version will be applied to new participants.
