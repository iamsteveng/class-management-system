// Regenerates convex/termsContent.ts from content/terms/cycling-waiver.md.
// Run after editing the waiver:  node scripts/build-terms.mjs
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const source = "content/terms/cycling-waiver.md";
const out = "convex/termsContent.ts";
// Reuse the same parser the tests check, via a one-off TypeScript run.
const json = execFileSync(
  "npx",
  ["--yes", "tsx", "-e", `import { parseTermsMarkdown } from "./lib/termsText"; import { readFileSync } from "node:fs"; process.stdout.write(JSON.stringify(parseTermsMarkdown(readFileSync(${JSON.stringify(source)}, "utf8"))));`],
  { encoding: "utf8" }
);
const { version, text } = JSON.parse(json);
writeFileSync(
  out,
  `// Generated from ${source} by scripts/build-terms.mjs. Do not edit by hand.\n\n` +
    `export const CYCLING_WAIVER_VERSION = ${JSON.stringify(version)};\n\n` +
    `export const CYCLING_WAIVER_TEXT = ${JSON.stringify(text)};\n`
);
console.log(`Wrote ${out} (version ${version}, ${text.length} characters).`);
