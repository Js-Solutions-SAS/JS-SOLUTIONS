import { GitCompareArrows } from "lucide-react";

import { CambiosBoard } from "@/components/organisms/cambios/cambios-board";
import { OperationsPageTemplate } from "@/components/templates/operations-page-template";
import { Skeleton } from "@/components/atoms/skeleton";
import { getChangeRequests } from "@/lib/admin-data";

async function CambiosSection() {
  const items = await getChangeRequests();
  return <CambiosBoard initialItems={items} />;
}

function CambiosFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5"
          >
            <Skeleton className="h-4 w-28" />
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

export default function CambiosPage() {
  return (
    <OperationsPageTemplate
      title="Control de Cambios"
      description="Gestiona solicitudes de cambio con impacto en costo y fecha para proteger alcance y margen."
      icon={GitCompareArrows}
      fallback={<CambiosFallback />}
    >
        <CambiosSection />
    </OperationsPageTemplate>
  );
}
