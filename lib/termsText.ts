/**
 * Turns a terms document written in Markdown (content/terms/*.md) into the plain text the
 * site shows, and reads its version from the leading `<!-- version: … -->` comment.
 */
export function parseTermsMarkdown(markdown: string): { version: string; text: string } {
  const versionMatch = markdown.match(/<!--\s*version:\s*([^\s—-][^—\n]*?)\s*(?:—[^>]*)?-->/);
  if (!versionMatch) throw new Error("Terms document has no <!-- version: … --> line.");
  const text = markdown
    .replace(/<!--[\s\S]*?-->\n*/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^\*\s+/, "・")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\\([.\-*_#()[\]])/g, "$1")
        .replace(/\s+$/, "")
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { version: versionMatch[1].trim(), text };
}
