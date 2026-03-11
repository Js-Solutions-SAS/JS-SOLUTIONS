import { BriefcaseBusiness } from "lucide-react";

import { PortafolioBoard } from "@/components/organisms/portafolio/portafolio-board";
import { OperationsPageTemplate } from "@/components/templates/operations-page-template";
import { Skeleton } from "@/components/atoms/skeleton";
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
    <OperationsPageTemplate
      title="Portafolio Ejecutivo"
      description="Salud integral por industria (público, retail, lujo y media) para decisiones estratégicas."
      icon={BriefcaseBusiness}
      fallback={<PortafolioFallback />}
    >
        <PortafolioSection />
    </OperationsPageTemplate>
  );
}
