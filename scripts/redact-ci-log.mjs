import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Best-effort minimization before CI log excerpts or AI analysis are persisted
 * or sent to a third-party model. The explicit owner opt-in gate remains the primary control.
 */
export function redactCiLog(input) {
  let value = String(input ?? "");
  const patterns = [
    [/\bAuthorization\s*:\s*(?:Bearer|Basic)\s+[^\s,;]+/gi, "Authorization: [REDACTED_AUTH]"],
    [/\b(?:Cookie|Set-Cookie)\s*:\s*[^\r\n]*/gi, "Cookie: [REDACTED_COOKIE]"],
    [/([?&](?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|secret|password|signature|client_secret|code)=)[^&\s#]*/gi, "$1[REDACTED]"],
    [/((?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|private[_-]?key|password|passwd|secret|authorization|cookie)\s*["']?\s*[:=]\s*["']?)(?!\[REDACTED(?:_[A-Z]+)?\])[^"'\s,;}&]+/gi, "$1[REDACTED]"],
    [/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, "[REDACTED_GITHUB_TOKEN]"],
    [/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, "[REDACTED_GITHUB_PAT]"],
    [/\bsk-[A-Za-z0-9_-]{20,}\b/g, "[REDACTED_API_KEY]"],
    [/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED_AWS_KEY]"],
    [/\bASIA[0-9A-Z]{16}\b/g, "[REDACTED_AWS_SESSION_KEY]"],
    [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, "[REDACTED_SLACK_TOKEN]"],
    [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/g, "[REDACTED_JWT]"],
    [/\bhttps?:\/\/[^\s/:@]+:[^\s/@]+@/gi, "[REDACTED_URL_CREDENTIALS]"],
    [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]"],
  ];
  for (const [pattern, replacement] of patterns) value = value.replace(pattern, replacement);
  return value;
}

const invokedDirectly = process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  let input = "";
  for await (const chunk of process.stdin) input += chunk.toString("utf8");
  process.stdout.write(redactCiLog(input));
}
