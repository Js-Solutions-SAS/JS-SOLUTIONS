import { Headset } from "lucide-react";

import { TicketsSLABoard } from "@/components/organisms/sla/tickets-sla-board";
import { OperationsPageTemplate } from "@/components/templates/operations-page-template";
import { Skeleton } from "@/components/atoms/skeleton";
import {
  getTicketSLAClientSummaries,
  getTicketSLAEntries,
  getTicketSLAMetrics,
} from "@/lib/admin-data";

async function SLASection() {
  const entries = await getTicketSLAEntries();
  const metrics = getTicketSLAMetrics(entries);
  const summaries = getTicketSLAClientSummaries(entries);

  return <TicketsSLABoard entries={entries} metrics={metrics} summaries={summaries} />;
}

function SLAFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-14" />
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

export default function SLAPage() {
  return (
    <OperationsPageTemplate
      title="SLA de Tickets"
      description="Controla tiempos de respuesta y resolución por tipo de cliente para proteger experiencia y cumplimiento."
      icon={Headset}
      fallback={<SLAFallback />}
    >
        <SLASection />
    </OperationsPageTemplate>
  );
}
