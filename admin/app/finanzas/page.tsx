import { Suspense } from "react";
import { CircleDollarSign } from "lucide-react";

import { FinanzasBoard } from "@/components/finanzas/finanzas-board";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getOperationalFinanceClientSummaries,
  getOperationalFinanceEntries,
  getOperationalFinanceMetrics,
} from "@/lib/admin-data";

async function FinanzasSection() {
  const entries = await getOperationalFinanceEntries();
  const metrics = getOperationalFinanceMetrics(entries);
  const summaries = getOperationalFinanceClientSummaries(entries);

  return <FinanzasBoard entries={entries} metrics={metrics} summaries={summaries} />;
}

function FinanzasFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr,2fr]">
        <div className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-4 h-72 w-full" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="mt-4 h-10 w-full" />
          <Skeleton className="mt-3 h-72 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function FinanzasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
          <CircleDollarSign className="h-8 w-8 text-brand-gold" />
          Finanzas Operativas
        </h1>
        <p className="mt-1 text-sm text-brand-off-white/70">
          Control de presupuesto vs ejecutado vs pendiente de facturar por proyecto y tipo de cliente.
        </p>
      </div>

      <Suspense fallback={<FinanzasFallback />}>
        <FinanzasSection />
      </Suspense>
    </div>
  );
}
