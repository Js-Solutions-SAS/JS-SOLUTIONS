interface AuthConfig {
  adminUsername: string;
  adminPasswordHash: string;
  adminPasswordHashAlt?: string;
  sessionSecret: string;
  csrfSecret: string;
}

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function isAuthConfigured(): boolean {
  return Boolean(
    readEnv("AUTH_ADMIN_USERNAME") &&
    readEnv("AUTH_ADMIN_PASSWORD_HASH") &&
    readEnv("AUTH_SESSION_SECRET"),
  );
}

export function getAuthConfig(): AuthConfig {
  const adminUsername = readEnv("AUTH_ADMIN_USERNAME");
  const adminPasswordHash = readEnv("AUTH_ADMIN_PASSWORD_HASH");
  const adminPasswordHashAlt =
    readEnv("AUTH_ADMIN_PASSWORD_HASH_ALT") || undefined;
  const sessionSecret = readEnv("AUTH_SESSION_SECRET");
  const csrfSecret = readEnv("AUTH_CSRF_SECRET") || sessionSecret;

  if (!adminUsername || !adminPasswordHash || !sessionSecret || !csrfSecret) {
    throw new Error(
      "Auth misconfigured. Required env vars: AUTH_ADMIN_USERNAME, AUTH_ADMIN_PASSWORD_HASH, AUTH_SESSION_SECRET",
    );
  }

  if (sessionSecret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must be at least 32 characters long.");
  }

  if (csrfSecret.length < 32) {
    throw new Error("AUTH_CSRF_SECRET must be at least 32 characters long.");
  }

  return {
    adminUsername,
    adminPasswordHash,
    adminPasswordHashAlt,
    sessionSecret,
    csrfSecret,
  };
}
