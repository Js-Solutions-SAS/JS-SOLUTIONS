import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createCsrfToken } from "@/lib/auth/csrf";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth/constants";
import { isAuthConfigured } from "@/lib/auth/env";
import { sanitizeRedirectPath } from "@/lib/auth/request";
import { getServerSession } from "@/lib/auth/server-session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login | JS Solutions Admin",
  description: "Acceso seguro a la consola administrativa.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  if (!isAuthConfigured()) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-2xl items-center px-4 py-10 sm:px-8">
        <div className="w-full rounded-2xl border border-rose-400/30 bg-brand-charcoal/90 p-8 text-rose-100 shadow-2xl">
          <h1 className="text-2xl font-semibold text-white">Autenticacion no configurada</h1>
          <p className="mt-3 text-sm leading-relaxed text-rose-100/90">
            Define <code>AUTH_ADMIN_USERNAME</code>, <code>AUTH_ADMIN_PASSWORD_HASH</code> y
            <code> AUTH_SESSION_SECRET</code> en <code>admin/.env.local</code> para habilitar el login.
          </p>
        </div>
      </div>
    );
  }

  const activeSession = await getServerSession();
  const nextPath = sanitizeRedirectPath(searchParams?.next || DEFAULT_AUTH_REDIRECT);

  if (activeSession) {
    redirect(nextPath);
  }

  const csrfToken = await createCsrfToken("login");

  return <LoginForm csrfToken={csrfToken} redirectPath={nextPath} />;
}
