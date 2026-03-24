interface RateLimitRule {
  limit: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  windowStart: number;
}

type RateStore = Map<string, Bucket>;

declare global {
  // eslint-disable-next-line no-var
  var __JS_LANDING_RATE_STORE__: RateStore | undefined;
}

function getStore(): RateStore {
  if (!globalThis.__JS_LANDING_RATE_STORE__) {
    globalThis.__JS_LANDING_RATE_STORE__ = new Map<string, Bucket>();
  }

  return globalThis.__JS_LANDING_RATE_STORE__;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for") || "";
  const fromForwarded = forwarded.split(",")[0]?.trim();
  if (fromForwarded) {
    return fromForwarded;
  }

  return headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(key: string, rule: RateLimitRule): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const store = getStore();
  const current = store.get(key);

  if (!current || now - current.windowStart > rule.windowMs) {
    store.set(key, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= rule.limit) {
    const retryAfterMs = Math.max(0, rule.windowMs - (now - current.windowStart));
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  current.count += 1;
  store.set(key, current);
  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}
