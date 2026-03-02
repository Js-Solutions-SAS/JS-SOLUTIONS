"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { consumeCsrfToken } from "@/lib/auth/csrf";
import {
  DEFAULT_AUTH_REDIRECT,
  LOGIN_PATH,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import { fixedDelay } from "@/lib/auth/crypto";
import {
  isCredentialInputValid,
  normalizeUsername,
  verifyAdminCredentials,
} from "@/lib/auth/credentials";
import {
  clearLoginRateLimit,
  checkLoginRateLimit,
  registerFailedLogin,
} from "@/lib/auth/rate-limit";
import {
  getClientIp,
  isSameOriginRequest,
  sanitizeRedirectPath,
} from "@/lib/auth/request";
import { issueSessionToken } from "@/lib/auth/session";

export interface LoginActionState {
  error: string | null;
}

const GENERIC_LOGIN_ERROR =
  "No fue posible iniciar sesion. Verifica tus credenciales e intenta de nuevo.";

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const headerStore = headers();
  const cookieStore = cookies();

  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const csrfToken = String(formData.get("csrfToken") || "");
  const remember = String(formData.get("remember") || "") === "on";
  const redirectPath = sanitizeRedirectPath(
    String(formData.get("next") || DEFAULT_AUTH_REDIRECT),
  );

  if (!isSameOriginRequest(headerStore)) {
    await fixedDelay();
    return { error: "Solicitud invalida." };
  }

  const csrfValid = await consumeCsrfToken(csrfToken, "login");
  if (!csrfValid) {
    await fixedDelay();
    return {
      error: "La sesion del formulario expiro. Recarga e intenta de nuevo.",
    };
  }

  const ipAddress = getClientIp(headerStore);
  const rateLimit = checkLoginRateLimit(username, ipAddress);

  if (rateLimit.blocked) {
    return {
      error: `Demasiados intentos. Espera ${Math.ceil(
        rateLimit.retryAfterSeconds / 60,
      )} minuto(s) antes de reintentar.`,
    };
  }

  if (!isCredentialInputValid(username, password)) {
    registerFailedLogin(username, ipAddress);
    await fixedDelay();
    return { error: GENERIC_LOGIN_ERROR };
  }

  try {
    const isValid = await verifyAdminCredentials(username, password);

    if (!isValid) {
      registerFailedLogin(username, ipAddress);
      await fixedDelay();
      return { error: GENERIC_LOGIN_ERROR };
    }

    clearLoginRateLimit(username, ipAddress);

    const session = await issueSessionToken({
      username: normalizeUsername(username),
      remember,
    });

    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(session.expiresAt * 1000),
    });
  } catch (error: Error | unknown) {
    console.error("[AUTH_LOGIN] Authentication flow failed", error);
    await fixedDelay();
    return {
      error: "No se pudo completar el inicio de sesion en este momento.",
    };
  }

  console.log("[DEBUG LOGIN] Setting cookies successful, will now redirect.");

  if (redirectPath === LOGIN_PATH) {
    console.log("[DEBUG LOGIN] Redirecting to DEFAULT:", DEFAULT_AUTH_REDIRECT);
    redirect(DEFAULT_AUTH_REDIRECT);
  }

  console.log("[DEBUG LOGIN] Redirecting to path:", redirectPath);
  redirect(redirectPath);
}
