# Development Guide

## ⚠️ Two Convex Deployments — Critical

This project has **two completely separate Convex environments**. Data in one is invisible to the other.

| Environment | Convex URL | Vercel URL |
|---|---|---|
| **Production** | `colorless-raven-523.convex.cloud` | `class-management-system-teal.vercel.app` |
| **Dev** | `graceful-mole-393.convex.cloud` | Local only |

**If you create a purchase/participant/session on dev, it will NOT appear on the production website. The token will be invalid.**

---

## Running Convex CLI Commands

Always include `--prod` when targeting production:

```bash
# Run a function on PRODUCTION
npx convex run testPurchase:createTestPurchase '{"customer_mobile": "..."}' --prod

# Run a function on DEV (default — no flag needed)
npx convex run testPurchase:createTestPurchase '{"customer_mobile": "..."}'

# Deploy functions to production
npx convex deploy --yes
# (Always deploys to prod — verify output says: "Deploying to colorless-raven-523")

# List deployed functions on production
npx convex function-spec --prod

# List deployed functions on dev
npx convex function-spec
```

---

## Deploying

### Convex functions (backend)
```bash
npx convex deploy --yes
# Verify: "Deploying to https://colorless-raven-523.convex.cloud..."
```

### Vercel (frontend)
```bash
vercel --prod --yes
```

> ⚠️ `vercel env pull` overwrites `.env.local` and removes the Convex config. After running it, restore `.env.local`:
> ```
> CONVEX_DEPLOYMENT=dev:graceful-mole-393
> ```

---

## Setting Convex Environment Variables

```bash
# List current prod env vars
npx convex env list --prod   # (or set CONVEX_DEPLOYMENT=prod:colorless-raven-523 first)

# Set a prod env var — use printf to avoid trailing newline
printf 'value' | npx convex env set VAR_NAME production

# ❌ Don't use echo — adds trailing \n which corrupts the value
echo 'value' | npx convex env set VAR_NAME production
```

---

## Seeding / Test Data

Always use `--prod` when seeding data you want to test against the live website:

```bash
# Seed initial data on prod
npx convex run seed:seedInitialData '{}' --prod

# Create a test purchase on prod
npx convex run testPurchase:createTestPurchase '{"customer_mobile": "YOUR_NUMBER", "participant_count": 1}' --prod

# Send WhatsApp confirmation on prod
npx convex run purchaseConfirmation:sendPurchaseConfirmation '{"purchase_id": "ID_FROM_ABOVE"}' --prod
```

---

## Admin Portal

- URL: `https://class-management-system-teal.vercel.app/admin/login`
- Default credentials: `admin` / `admin123` (super admin)

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS
- **Backend:** Convex (functions, DB, cron, file storage)
- **WhatsApp:** Twilio
- **Hosting:** Vercel (frontend) + Convex (backend)
