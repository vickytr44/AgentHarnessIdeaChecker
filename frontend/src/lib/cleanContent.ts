/**
 * Helper to clean escaped strings — unescapes JSON-encoded content
 * and normalizes escaped newlines for Markdown rendering.
 */
export function cleanContent(raw?: string): string {
  if (!raw) return "";
  let str = raw.trim();
  if (str.startsWith('"') && str.endsWith('"') && str.includes("\\n")) {
    try {
      str = JSON.parse(str);
    } catch {
      str = str.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  } else {
    str = str.replace(/\\n/g, "\n");
  }
  return str;
}
