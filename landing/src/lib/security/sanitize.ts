const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const TAGS_REGEX = /<[^>]*>/g;

function sanitizeString(value: string, maxLength = 2000): string {
  return value
    .replace(TAGS_REGEX, "")
    .replace(CONTROL_CHARS_REGEX, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeUnknown(value: unknown, depth = 0): unknown {
  if (depth > 5) {
    return undefined;
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknown(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 150);
    return entries.reduce<Record<string, unknown>>((acc, [key, item]) => {
      acc[sanitizeString(key, 120)] = sanitizeUnknown(item, depth + 1);
      return acc;
    }, {});
  }

  return undefined;
}

export function sanitizePayload<T = Record<string, unknown>>(payload: unknown): T {
  return sanitizeUnknown(payload) as T;
}

export function sanitizeEmail(value: unknown): string {
  const email = sanitizeString(String(value ?? ""), 320).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function isHoneypotTriggered(payload: Record<string, unknown>): boolean {
  const honeypotKeys = ["website", "companyWebsite", "hpField", "_hp"];
  return honeypotKeys.some((key) => {
    const value = payload[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}
