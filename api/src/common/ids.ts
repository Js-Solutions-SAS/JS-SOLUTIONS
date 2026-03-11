export function generateCorrelationId(prefix: string): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function generateIdempotencyKey(scope: string, ref: string): string {
  const normalizedScope = String(scope || 'default')
    .replace(/\s+/g, '-')
    .toLowerCase();
  const normalizedRef = String(ref || 'unknown')
    .replace(/\s+/g, '-')
    .toLowerCase();

  return `${normalizedScope}:${normalizedRef}`;
}

export function generateFallbackId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
