# Class Management System — Agent Instructions

## Before You Do Anything

Read the project structure carefully before implementing. This is a Next.js + Convex app.

## Stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, hosted on Vercel
- **Backend:** Convex (functions, database, cron, file storage)
- **WhatsApp:** Twilio
- **Auth:** Custom admin auth (username/password, stored in Convex)

## Key Conventions
- Convex schema is in `convex/schema.ts` — update it first when adding new fields/tables
- Convex functions go in `convex/` directory (queries, mutations, actions)
- Frontend pages go in `app/` using Next.js App Router
- Admin portal is at `app/admin/`
- Participant-facing pages: `app/participant/[participant_id]/` and `app/terms/`
- Use `v.optional(...)` in Convex schema for optional fields
- Run `npx convex dev` to sync schema changes (but don't run it in implementation — just write the code)
- Tailwind for all styling — no custom CSS unless necessary

## Working on a Story
1. Check `progress.txt` for prior learnings (Codebase Patterns section)
2. Implement the story
3. Run typecheck: `npx tsc --noEmit`
4. Commit with: `feat: [Story ID] - [Story Title]`
