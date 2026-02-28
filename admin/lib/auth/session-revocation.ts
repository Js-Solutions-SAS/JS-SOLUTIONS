type RevocationStore = Map<string, number>;

declare global {
  // eslint-disable-next-line no-var
  var __JS_ADMIN_REVOKED_SESSIONS__: RevocationStore | undefined;
}

function getStore(): RevocationStore {
  if (!globalThis.__JS_ADMIN_REVOKED_SESSIONS__) {
    globalThis.__JS_ADMIN_REVOKED_SESSIONS__ = new Map<string, number>();
  }

  return globalThis.__JS_ADMIN_REVOKED_SESSIONS__;
}

function cleanupExpired(store: RevocationStore): void {
  const nowSeconds = Math.floor(Date.now() / 1000);

  store.forEach((expiresAt, sessionId) => {
    if (expiresAt <= nowSeconds) {
      store.delete(sessionId);
    }
  });
}

export function revokeSession(sessionId: string, expiresAt: number): void {
  const store = getStore();
  cleanupExpired(store);
  store.set(sessionId, expiresAt);
}

export function isSessionRevoked(sessionId: string): boolean {
  const store = getStore();
  cleanupExpired(store);
  return store.has(sessionId);
}
