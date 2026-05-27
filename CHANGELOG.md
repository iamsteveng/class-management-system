# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.2.0] - 2026-05-26

### Added

- **Airwallex payment** — native card checkout with quantity selector and multi-pass support
- **Two pricing tiers** — single price and group price per class
- **Admin cancel & refund** — admins can cancel a purchase and trigger an Airwallex refund
- **Slack notifications** — alert on terms acceptance; non-production notifications prefixed with `[TEST]`
- **Bilingual apply page** — EN/ZH support across the checkout flow

### Changed

- Cleaned up hero section — removed unused CTA buttons
- Simplified group price labels on homepage

### Fixed

- Group pricing was ignored in payment confirmation — always fell back to single price
- Duplicate WhatsApp messages on concurrent confirm + webhook calls
