import { ClipboardCheck } from "lucide-react";

import { AprobacionesBoard } from "@/components/organisms/aprobaciones/aprobaciones-board";
import { OperationsPageTemplate } from "@/components/templates/operations-page-template";
import { Skeleton } from "@/components/atoms/skeleton";
import { getApprovals } from "@/lib/admin-data";

async function AprobacionesSection() {
  const items = await getApprovals();

  return <AprobacionesBoard initialItems={items} />;
}

function AprobacionesFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-12" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr,2fr]">
        <div className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
          <Skeleton className="h-6 w-48" />
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

export default function AprobacionesPage() {
  return (
    <OperationsPageTemplate
      title="Aprobaciones"
      description="Gestiona checkpoints de brief, alcance, QA, UAT, contrato y cambios de alcance."
      icon={ClipboardCheck}
      fallback={<AprobacionesFallback />}
    >
        <AprobacionesSection />
    </OperationsPageTemplate>
  );
}
