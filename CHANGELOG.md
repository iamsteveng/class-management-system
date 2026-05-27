# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.2.0] - 2026-05-26

### Added

- **Airwallex native card payment** — integrated Airwallex card element for in-page payment checkout
- **Bilingual apply page** — EN/ZH apply page with price cache-busting and UX improvements
- **Quantity selector** — users can purchase multiple passes in a single transaction
- **Participant passes page** — landing page listing all passes for a multi-quantity purchase
- **Two pricing tiers** — support for single price and group price per class
- **Admin cancel & refund** — admins can cancel an Airwallex purchase and trigger a refund from the admin panel
- **Slack notification on terms acceptance** — notify Slack channel when a participant completes the terms form
- **Slack [TEST] prefix** — non-production deployments prefix Slack notifications with `[TEST]` to distinguish from live events
- **Height column** in session participants table

### Changed

- Removed 探索單車課程 blue button from hero section
- Removed 網上報名 button from mobile hero section
- Simplified group price labels — removed 團體優惠 prefix, showing quantity only
- Bilingual Apply button and cleaner price tier display on homepage
- Moved Airwallex refund call to a Next.js Server Action so credentials remain in Vercel only

### Fixed

- Group pricing not applied in `/api/payment/confirm` — was always falling back to single price
- Duplicate WhatsApp messages sent on concurrent confirm + webhook calls
- Airwallex refund endpoint corrected to `/api/v1/pa/refunds/create`
- Airwallex error JSON now parsed and surfaces pending-refund guidance on 400 responses
- `airwallex` source missing from `adminPurchases` source union — was blocking the Purchases admin page
- `slot_index` used instead of `order_id` suffix for multi-quantity purchase slots
- Airwallex card element mount and listener order restored (`enabledElements` was missing)
- Airwallex card `error` event listener cast workaround for TypeScript type constraint
- `getClassListPageData` now includes Airwallex fields; card element initialisation fixed
- `makeFunctionReference` used for payments action to resolve Vercel build failure
- Airwallex API version pinned to `2025-06-16` on all outbound requests
- `CONVEX_ENV` variable used for `[TEST]` prefix detection — `NODE_ENV` is always `production` inside Convex
- `APP_ENV=prod` used to detect production environment for Slack prefix logic
