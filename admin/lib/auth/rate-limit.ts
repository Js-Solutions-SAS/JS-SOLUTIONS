import {
  LOGIN_LOCK_MS,
  LOGIN_MAX_ATTEMPTS_PER_IP,
  LOGIN_MAX_ATTEMPTS_PER_USER,
  LOGIN_RATE_WINDOW_MS,
} from "@/lib/auth/constants";

interface LoginBucket {
  attempts: number;
  windowStartedAt: number;
  lockUntil: number;
}

type LoginRateStore = Map<string, LoginBucket>;

declare global {
  // eslint-disable-next-line no-var
  var __JS_ADMIN_LOGIN_RATE_STORE__: LoginRateStore | undefined;
}

function getStore(): LoginRateStore {
  if (!globalThis.__JS_ADMIN_LOGIN_RATE_STORE__) {
    globalThis.__JS_ADMIN_LOGIN_RATE_STORE__ = new Map<string, LoginBucket>();
  }

  return globalThis.__JS_ADMIN_LOGIN_RATE_STORE__;
}

function getBucket(store: LoginRateStore, key: string, nowMs: number): LoginBucket {
  const existing = store.get(key);
  if (existing) {
    if (nowMs - existing.windowStartedAt > LOGIN_RATE_WINDOW_MS) {
      existing.attempts = 0;
      existing.windowStartedAt = nowMs;
      existing.lockUntil = 0;
    }

    return existing;
  }

  const created: LoginBucket = {
    attempts: 0,
    windowStartedAt: nowMs,
    lockUntil: 0,
  };

  store.set(key, created);
  return created;
}

function checkBucket(bucket: LoginBucket, maxAttempts: number, nowMs: number): {
  blocked: boolean;
  retryAfterSeconds: number;
} {
  if (bucket.lockUntil > nowMs) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((bucket.lockUntil - nowMs) / 1000),
    };
  }

  if (bucket.attempts >= maxAttempts) {
    bucket.lockUntil = nowMs + LOGIN_LOCK_MS;
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil(LOGIN_LOCK_MS / 1000),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase() || "anonymous";
}

export function checkLoginRateLimit(
  username: string,
  ipAddress: string,
): { blocked: boolean; retryAfterSeconds: number } {
  const nowMs = Date.now();
  const store = getStore();

  const byUser = getBucket(store, `user:${normalizeUsername(username)}`, nowMs);
  const byIp = getBucket(store, `ip:${ipAddress || "unknown"}`, nowMs);

  const userStatus = checkBucket(byUser, LOGIN_MAX_ATTEMPTS_PER_USER, nowMs);
  const ipStatus = checkBucket(byIp, LOGIN_MAX_ATTEMPTS_PER_IP, nowMs);

  if (userStatus.blocked || ipStatus.blocked) {
    return {
      blocked: true,
      retryAfterSeconds: Math.max(
        userStatus.retryAfterSeconds,
        ipStatus.retryAfterSeconds,
      ),
    };
  }

  return { blocked: false, retryAfterSeconds: 0 };
}

export function registerFailedLogin(username: string, ipAddress: string): void {
  const nowMs = Date.now();
  const store = getStore();

  const byUser = getBucket(store, `user:${normalizeUsername(username)}`, nowMs);
  const byIp = getBucket(store, `ip:${ipAddress || "unknown"}`, nowMs);

  byUser.attempts += 1;
  byIp.attempts += 1;
}

export function clearLoginRateLimit(username: string, ipAddress: string): void {
  const store = getStore();
  store.delete(`user:${normalizeUsername(username)}`);
  store.delete(`ip:${ipAddress || "unknown"}`);
}
