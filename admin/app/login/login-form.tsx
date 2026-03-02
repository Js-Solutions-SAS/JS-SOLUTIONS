"use client";

import Image from "next/image";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { type LoginActionState, loginAction } from "./actions";

const LOGIN_INITIAL_STATE: LoginActionState = {
  error: null,
};

interface LoginFormProps {
  csrfToken: string;
  redirectPath: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Validando acceso..." : "Iniciar sesion"}
    </Button>
  );
}

export function LoginForm({ csrfToken, redirectPath }: LoginFormProps) {
  const [state, formAction] = useFormState(loginAction, LOGIN_INITIAL_STATE);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center px-4 py-10 sm:px-0">
      <Card className="w-full border-white/15 bg-brand-charcoal/90">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-brand-off-white/80 hover:text-white"
            >
              <Image
                src="/logo.svg"
                alt="JS Solutions"
                width={28}
                height={28}
                className="h-7 w-auto"
                priority
              />
              <span className="text-sm font-medium">JS Solutions Admin</span>
            </Link>
            <ShieldCheck className="h-5 w-5 text-brand-gold" />
          </div>

          <div>
            <CardTitle className="flex items-center gap-2 text-2xl text-white">
              <LockKeyhole className="h-6 w-6 text-brand-gold" />
              Acceso Seguro
            </CardTitle>
            <p className="mt-1 text-sm text-brand-off-white/70">
              Consola protegida con autenticacion local y sesiones HttpOnly.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="next" value={redirectPath} />

            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-brand-off-white/85"
              >
                Usuario
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                maxLength={120}
                placeholder="admin"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-brand-off-white/85"
              >
                Contraseña
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
                placeholder="••••••••"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-brand-off-white/80">
              <input
                type="checkbox"
                name="remember"
                className="h-4 w-4 rounded border-white/20 bg-black/20 text-brand-gold focus:ring-brand-gold/30"
              />
              Mantener sesion por 14 dias
            </label>

            {state.error ? (
              <p className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                {state.error}
              </p>
            ) : null}

            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
