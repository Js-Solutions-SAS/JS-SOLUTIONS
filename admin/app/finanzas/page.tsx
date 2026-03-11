import { CircleDollarSign } from "lucide-react";

import { FinanzasBoard } from "@/components/organisms/finanzas/finanzas-board";
import { OperationsPageTemplate } from "@/components/templates/operations-page-template";
import { Skeleton } from "@/components/atoms/skeleton";
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
    <OperationsPageTemplate
      title="Finanzas Operativas"
      description="Control de presupuesto vs ejecutado vs pendiente de facturar por proyecto y tipo de cliente."
      icon={CircleDollarSign}
      fallback={<FinanzasFallback />}
    >
        <FinanzasSection />
    </OperationsPageTemplate>
  );
}
