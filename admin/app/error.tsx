"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/atoms/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-rose-400/30 bg-brand-charcoal p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Error de conexion</h2>
        <p className="mt-2 text-sm text-brand-off-white/75">
          No fue posible completar la sincronizacion con n8n o Google Sheets. Intenta de nuevo.
        </p>

        <p className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-brand-off-white/70">{error.message}</p>

        <div className="mt-5">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  );
}
