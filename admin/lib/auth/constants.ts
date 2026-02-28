export const SESSION_COOKIE_NAME = "js_admin_session";

export const LOGIN_PATH = "/login";
export const DEFAULT_AUTH_REDIRECT = "/";

export const SESSION_TTL_SECONDS = 60 * 60 * 12;
export const REMEMBER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS_PER_USER = 5;
export const LOGIN_MAX_ATTEMPTS_PER_IP = 25;
