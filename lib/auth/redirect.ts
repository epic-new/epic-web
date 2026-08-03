const INTERNAL_ORIGIN = "http://internal.local";
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/;

function isSafeInternalPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || CONTROL_CHARACTER_PATTERN.test(value)) return false;

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || decoded.includes("\\")) return false;

    return new URL(value, INTERNAL_ORIGIN).origin === INTERNAL_ORIGIN;
  } catch {
    return false;
  }
}

export function safeRedirectPath(
  value: string | null | undefined,
  fallback: string,
): string {
  return value && isSafeInternalPath(value) ? value : fallback;
}
