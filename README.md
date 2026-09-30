# Class Management System

## DevOps

### Convex

This project has two separate Convex environments:

| Environment | Deployment URL | Purpose |
|---|---|---|
| **Dev** | `graceful-mole-393.convex.cloud` | Local development and testing |
| **Production** | `colorless-raven-523.convex.cloud` | Live app (used by Vercel production) |

**Deploy to Convex dev**
```bash
npx convex dev --once
```

**Deploy to Convex production**
```bash
npx convex deploy --yes
```
Verify the output line reads `Deploying to https://colorless-raven-523.convex.cloud...` before confirming.

> **Note:** `.env.local` must contain `CONVEX_DEPLOYMENT=dev:graceful-mole-393`. Running `vercel env pull` overwrites this file — restore the line above afterwards.

---

### Vercel

**Deploy to Vercel Preview**
```bash
vercel
```

**Deploy to Vercel Production**
```bash
vercel --prod
```

After deploying a new Vercel Preview, update the `APP_BASE_URL` environment variable in Convex dev so WhatsApp links point to the correct preview URL:
```bash
npx convex env set APP_BASE_URL "https://<preview-url>.vercel.app"
```

---

## Adding a New Class

Classes are only sold on this site. Adding one needs no code change.

### 1. Admin Portal
- [ ] Create the class in the admin portal (`/admin/classes`) — set the name, and tick **Free of charge** if it is free
- [ ] Add sessions for the class (`/admin/classes/{class_id}/sessions`)
- [ ] For a paid class, **Edit** it and fill in the **Airwallex** fields:

| Field | Description | Example |
|---|---|---|
| **Airwallex Price** | Price per person (single / default) | `298` |
| **Airwallex Currency** | ISO currency code | `HKD` |
| **Group Price** _(optional)_ | Discounted price per person when buying in a group | `250` |
| **Min Qty for Group Price** _(optional)_ | Minimum quantity to qualify for group price | `2` |

A class is on sale — shown on the homepage and returned by `/api/classes` — once it is active and has an Airwallex Price or is free.
Its Purchase Link (`purchase_url` in the API, built from `APP_BASE_URL`) is `/apply/{class_id}`, where Customers enter their WhatsApp number, quantity (1–15), and pay by card.
After payment, N purchase records are created and a WhatsApp link is sent per participant.

> **Note:** Airwallex env vars must be set in Vercel: `AIRWALLEX_CLIENT_ID`, `AIRWALLEX_API_KEY`, `AIRWALLEX_ENV`, `NEXT_PUBLIC_AIRWALLEX_ENV`.

### 2. Homepage Card Content
- [ ] Upload an image for the class (e.g. to `asset.loco.hk` on S3) — it must be a full `https://` URL
- [ ] In the admin portal, edit the Class and fill in **Description (ZH/EN)**, **Duration (minutes)** and **Image URL** — the homepage card reads these straight from the Class

---

## Common Ops Issues

### WhatsApp message send failed

**Symptom:** A participant did not receive their WhatsApp confirmation message. The admin portal Ingestion page (`/admin/ingestion`) shows a failed send for the affected mobile number.

**Root cause:** ManyChat has a subscriber record for the phone number but the subscriber ID stored locally is missing or stale, causing the send to fail.

**Resolution:**

1. In ManyChat, find and delete the subscriber for the affected mobile number.
2. In the admin portal, go to **Ingestion** (`/admin/ingestion`) and click the **Resend** button for the affected purchase.
   - This triggers a fresh `createSubscriber` call to ManyChat, which creates a new subscriber ID and sends the WhatsApp message.

**Dev environment only — stale subscriber ID in DB:**

In dev, the `manychat_subscribers` table may hold a stale subscriber ID for a phone number (e.g. copied from production data or from a previous test run). This causes the send to skip `createSubscriber` and use the wrong ID.

To fix, update the subscriber ID directly in the `manychat_subscribers` table on Convex dev:

```bash
# Find the record
npx convex run testPurchase:debugTermsQuery '{"token":"<purchase_token>"}' 

# Or update manychat_subscribers directly via the Convex dashboard:
# https://dashboard.convex.dev/d/graceful-mole-393
# Table: manychat_subscribers — find by whatsapp_phone, update subscriber_id field
```
