/**
 * Strict Reply-To validation (standard v1.2, section 5). The visitor's address is used as Reply-To only
 * if it is exactly one plain address with no header-injection characters and a sane domain. Otherwise
 * Reply-To is omitted (the address still appears, escaped, in the email body).
 */
export function strictReplyTo(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (s.length < 6 || s.length > 254) return null;
  if (/[\r\n\t\0,;<>"'()\[\]\\\s]/.test(s)) return null; // CR/LF, lists, display names, quoting, spaces
  const at = s.indexOf("@");
  if (at < 1 || at !== s.lastIndexOf("@")) return null; // exactly one @
  const local = s.slice(0, at);
  const domain = s.slice(at + 1).toLowerCase();
  if (local.length > 64 || !/^[A-Za-z0-9!#$%&*+/=?^_`{|}~.-]+$/.test(local)) return null;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return null;
  if (domain.length > 253) return null;
  const labels = domain.split(".");
  if (labels.length < 2) return null;
  if (!labels.every((l) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l))) return null;
  if (!/^[a-z]{2,63}$/.test(labels[labels.length - 1])) return null; // alphabetic TLD (no IP literals)
  return s;
}
