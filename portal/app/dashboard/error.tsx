"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, RotateCcw, ShieldX } from "lucide-react";

interface DashboardErrorProps {
  error: Error;
  reset: () => void;
}

const WHATSAPP_RECOVERY_URL =
  "https://wa.me/573186110790?text=Hola%20JS%20Solutions%2C%20necesito%20un%20nuevo%20Magic%20Link%20para%20acceder%20al%20portal.";

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const isTokenError = /token|enlace|acceso/i.test(error.message);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f6f6f2] p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-b from-red-300/15 to-transparent blur-3xl" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-xl rounded-3xl border border-black/10 bg-white/85 p-8 shadow-2xl shadow-black/10 backdrop-blur-xl"
      >
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-red-300/50 bg-red-50 text-red-600">
          {isTokenError ? (
            <ShieldX className="h-7 w-7" />
          ) : (
            <AlertTriangle className="h-7 w-7" />
          )}
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-brand-charcoal">
          {isTokenError
            ? "No pudimos validar tu acceso"
            : "Hubo un inconveniente temporal"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          {isTokenError
            ? "El Magic Link puede haber expirado o ya no es válido. Solicita uno nuevo para continuar con una sesión segura."
            : "Estamos teniendo problemas para cargar tu información. Puedes intentar nuevamente en unos segundos."}
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <a
            href={WHATSAPP_RECOVERY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-charcoal px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] hover:bg-black"
          >
            Solicitar nuevo enlace
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm font-semibold text-brand-charcoal transition hover:scale-[1.01] hover:border-black/30"
          >
            Reintentar validación
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </motion.main>
    </div>
  );
}
