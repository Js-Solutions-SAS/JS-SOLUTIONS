import { UsersRound } from "lucide-react";

import { CapacityBoard } from "@/components/organisms/capacidad/capacity-board";
import { OperationsPageTemplate } from "@/components/templates/operations-page-template";
import { Skeleton } from "@/components/atoms/skeleton";
import { getCapacityMetrics, getTeamCapacity } from "@/lib/admin-data";

async function CapacitySection() {
  const entries = await getTeamCapacity();
  const metrics = getCapacityMetrics(entries);

  return <CapacityBoard entries={entries} metrics={metrics} />;
}

function CapacityFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-12" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="mt-3 h-64 w-full" />
      </div>
    </div>
  );
}

export default function CapacidadPage() {
  return (
    <OperationsPageTemplate
      title="Gestión de Capacidad"
      description="Controla carga por persona y rol para prevenir sobreasignación y proteger fechas de entrega."
      icon={UsersRound}
      fallback={<CapacityFallback />}
    >
        <CapacitySection />
    </OperationsPageTemplate>
  );
}
