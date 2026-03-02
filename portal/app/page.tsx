import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default function Home({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  if (searchParams?.error === "invalid_token") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/20 bg-brand-charcoal/80 p-8 text-center shadow-xl backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">
            Enlace Inválido
          </h1>
          <p className="text-brand-off-white/80">
            El enlace que has utilizado para acceder al portal no es válido o ha
            expirado. Por favor, solicita un nuevo enlace a tu administrador.
          </p>
        </div>
      </div>
    );
  }

  redirect("/dashboard");
}
