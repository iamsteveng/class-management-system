# Terms documents

`cycling-waiver.md` is the waiver Customers accept on everyone's behalf when they book. It
started as a copy of the Google Doc 「單車班 - 免責聲明書」; this file is now the source, and
`git log -p cycling-waiver.md` shows every change and why.

To change it:

1. Edit `cycling-waiver.md` and update the date in its `<!-- version: … -->` line.
2. Run `node scripts/build-terms.mjs` to regenerate `convex/termsContent.ts` (a unit test
   fails if you forget).
3. Merge. The catalogue seed (`revampCatalogue:seed`) publishes it as the new current Terms
   Version; earlier versions, and the Terms Acceptances that point at them, stay unchanged.
