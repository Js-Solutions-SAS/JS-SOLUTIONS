import argon2 from "argon2";

import { constantTimeEqual } from "@/lib/auth/crypto";
import { getAuthConfig } from "@/lib/auth/env";

const MAX_USERNAME_LENGTH = 120;
const MAX_PASSWORD_LENGTH = 256;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isCredentialInputValid(
  username: string,
  password: string,
): boolean {
  const normalizedUsername = username.trim();
  return (
    normalizedUsername.length > 0 &&
    normalizedUsername.length <= MAX_USERNAME_LENGTH &&
    password.length > 0 &&
    password.length <= MAX_PASSWORD_LENGTH
  );
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const { adminUsername, adminPasswordHash, adminPasswordHashAlt } =
    getAuthConfig();

  const normalizedInputUsername = normalizeUsername(username);
  const normalizedAdminUsername = normalizeUsername(adminUsername);

  const isUsernameMatch = constantTimeEqual(
    normalizedInputUsername,
    normalizedAdminUsername,
  );

  // Always verify the configured hash to keep response time consistent and reduce username probing.
  let isPasswordMatch = false;
  try {
    isPasswordMatch = await argon2.verify(adminPasswordHash, password);
    if (!isPasswordMatch && adminPasswordHashAlt) {
      isPasswordMatch = await argon2.verify(adminPasswordHashAlt, password);
    }
  } catch {
    return false;
  }

  return isUsernameMatch && isPasswordMatch;
}
