import { Suspense } from "react";
import { UsersRound } from "lucide-react";

import { CapacityBoard } from "@/components/capacidad/capacity-board";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
          <UsersRound className="h-8 w-8 text-brand-gold" />
          Gestión de Capacidad
        </h1>
        <p className="mt-1 text-sm text-brand-off-white/70">
          Controla carga por persona/rol para prevenir sobreasignación y proteger fechas de entrega.
        </p>
      </div>

      <Suspense fallback={<CapacityFallback />}>
        <CapacitySection />
      </Suspense>
    </div>
  );
}
