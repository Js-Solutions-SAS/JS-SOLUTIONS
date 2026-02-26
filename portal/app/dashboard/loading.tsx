import { ShieldCheck } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f6f2] p-6 sm:p-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-gold/25 to-transparent blur-3xl" />
        <div className="absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-black/5 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-6xl animate-[fadeIn_450ms_ease-out] space-y-8">
        <section className="rounded-3xl border border-black/10 bg-white/80 p-8 shadow-2xl shadow-black/5 backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative grid h-14 w-14 place-items-center rounded-2xl border border-brand-gold/35 bg-brand-gold/10">
              <div className="absolute inset-0 rounded-2xl border border-brand-gold/30 animate-ping" />
              <ShieldCheck className="h-6 w-6 text-brand-charcoal" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Seguridad JS Solutions
              </p>
              <h1 className="text-2xl font-semibold text-brand-charcoal sm:text-3xl">
                Validando acceso seguro...
              </h1>
            </div>
          </div>

          <p className="text-sm text-neutral-500">
            Estamos verificando tu token y sincronizando el estado del proyecto en tiempo real.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-black/10 bg-white p-6">
            <div className="skeleton-block h-4 w-32 rounded-full" />
            <div className="mt-4 skeleton-block h-9 w-40 rounded-xl" />
            <div className="mt-4 skeleton-block h-3 w-full rounded-full" />
          </div>
          <div className="rounded-3xl border border-black/10 bg-white p-6 lg:col-span-2">
            <div className="skeleton-block h-4 w-36 rounded-full" />
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`timeline-skeleton-${index}`}
                  className="rounded-2xl border border-black/10 p-4"
                >
                  <div className="skeleton-block h-8 w-8 rounded-xl" />
                  <div className="mt-3 skeleton-block h-3 w-20 rounded-full" />
                  <div className="mt-2 skeleton-block h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6">
          <div className="mb-4 skeleton-block h-4 w-52 rounded-full" />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`doc-skeleton-${index}`}
                className="rounded-2xl border border-black/10 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="skeleton-block h-9 w-9 rounded-xl" />
                  <div className="skeleton-block h-5 w-20 rounded-full" />
                </div>
                <div className="mt-4 skeleton-block h-3 w-3/4 rounded-full" />
                <div className="mt-2 skeleton-block h-3 w-1/2 rounded-full" />
                <div className="mt-5 skeleton-block h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
