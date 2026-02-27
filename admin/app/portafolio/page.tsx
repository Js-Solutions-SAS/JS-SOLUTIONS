import { Suspense } from "react";
import { BriefcaseBusiness } from "lucide-react";

import { PortafolioBoard } from "@/components/portafolio/portafolio-board";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getExecutivePortfolioEntries,
  getExecutivePortfolioMetrics,
} from "@/lib/admin-data";

async function PortafolioSection() {
  const entries = await getExecutivePortfolioEntries();
  const metrics = getExecutivePortfolioMetrics(entries);

  return <PortafolioBoard entries={entries} metrics={metrics} />;
}

function PortafolioFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-14" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="mt-3 h-72 w-full" />
      </div>
    </div>
  );
}

export default function PortafolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
          <BriefcaseBusiness className="h-8 w-8 text-brand-gold" />
          Portafolio Ejecutivo
        </h1>
        <p className="mt-1 text-sm text-brand-off-white/70">
          Salud integral por industria (público, retail, lujo y media) para decisiones estratégicas.
        </p>
      </div>

      <Suspense fallback={<PortafolioFallback />}>
        <PortafolioSection />
      </Suspense>
    </div>
  );
}
