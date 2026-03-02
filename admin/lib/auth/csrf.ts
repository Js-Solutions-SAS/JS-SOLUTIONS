import { SignJWT, jwtVerify } from "jose";

import { getAuthConfig } from "@/lib/auth/env";

const CSRF_ALGORITHM = "HS256";
const CSRF_TTL_SECONDS = 10 * 60;

type CSRFPurpose = "login";

function getCsrfSecret(): Uint8Array {
  const { csrfSecret } = getAuthConfig();
  return new TextEncoder().encode(csrfSecret);
}

export async function createCsrfToken(purpose: CSRFPurpose): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);

  return new SignJWT({
    purpose,
    nonce: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: CSRF_ALGORITHM, typ: "JWT" })
    .setIssuedAt(nowSeconds)
    .setNotBefore(nowSeconds)
    .setExpirationTime(nowSeconds + CSRF_TTL_SECONDS)
    .sign(getCsrfSecret());
}

export async function consumeCsrfToken(
  token: string,
  purpose: CSRFPurpose,
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getCsrfSecret(), {
      algorithms: [CSRF_ALGORITHM],
    });

    if (
      typeof payload.nonce !== "string" ||
      typeof payload.exp !== "number" ||
      payload.purpose !== purpose
    ) {
      console.log("[CSRF] Invalid payload fields", payload);
      return false;
    }

    return true;
  } catch (error) {
    console.log("[CSRF] Verification threw an error:", String(error));
    return false;
  }
}
