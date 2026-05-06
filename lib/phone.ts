/**
 * Normalize a phone number string to E.164 format.
 *
 * Rules (defaultCountryCode = "852" for Hong Kong):
 *   "+85254304789"    → "+85254304789"  (already E.164, no-op)
 *   "85254304789"     → "+85254304789"  (missing leading +)
 *   "0085254304789"   → "+85254304789"  (international dial prefix 00)
 *   "54304789"        → "+85254304789"  (8-digit HK local number)
 *   "+60123456789"    → "+60123456789"  (non-HK E.164, pass through)
 *   ""  / null        → null            (empty input)
 *
 * Returns null if the input cannot be reliably normalized.
 */
export function normalizeToE164(
  raw: string | null | undefined,
  defaultCountryCode = "852"
): string | null {
  if (!raw) return null;

  const stripped = raw.trim();
  if (!stripped) return null;

  // Reject clearly oversized input (E.164 max is 15 digits + "+" = 16 chars)
  if (stripped.length > 32) return null;

  // Already E.164 (starts with +)
  if (stripped.startsWith("+")) {
    const digits = stripped.slice(1).replace(/\D/g, "");
    if (digits.length >= 7) return `+${digits}`;
    return null;
  }

  // Strip all non-digit characters for further processing
  const digits = stripped.replace(/\D/g, "");

  // International dialing prefix "00" → "+" (require >= 9 chars after "00" to avoid
  // false positives like "0054304789" being misread as "+54304789" instead of "+85254304789")
  if (digits.startsWith("00")) {
    const withoutPrefix = digits.slice(2);
    if (withoutPrefix.length >= 9) return `+${withoutPrefix}`;
    // Too short after stripping "00" — fall through to local-number handling
  }

  // Starts with the default country code (e.g. "85254304789")
  if (digits.startsWith(defaultCountryCode)) {
    const localPart = digits.slice(defaultCountryCode.length);
    if (localPart.length >= 7) return `+${digits}`;
    // localPart too short — fall through to local-number handling
  }

  // Local number — prepend default country code
  if (digits.length >= 7 && digits.length <= 12) {
    return `+${defaultCountryCode}${digits}`;
  }

  return null;
}
