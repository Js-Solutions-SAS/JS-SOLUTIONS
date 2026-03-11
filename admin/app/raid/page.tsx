import { ShieldCheck } from "lucide-react";

import { RaidBoard } from "@/components/organisms/raid/raid-board";
import { OperationsPageTemplate } from "@/components/templates/operations-page-template";
import { Skeleton } from "@/components/atoms/skeleton";
import {
  getRaidItems,
  getRaidMetrics,
  getRaidProjectSummaries,
} from "@/lib/admin-data";

async function RaidSection() {
  const items = await getRaidItems();
  const metrics = getRaidMetrics(items);
  const summaries = getRaidProjectSummaries(items);

  return <RaidBoard items={items} metrics={metrics} summaries={summaries} />;
}

function RaidFallback() {
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

      <div className="grid gap-4 xl:grid-cols-[1.3fr,2fr]">
        <div className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-4 h-10 w-full" />
          <Skeleton className="mt-3 h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function RaidPage() {
  return (
    <OperationsPageTemplate
      title="RAID Log"
      description="Riesgos, supuestos, issues y dependencias por proyecto en una sola vista operativa."
      icon={ShieldCheck}
      fallback={<RaidFallback />}
    >
        <RaidSection />
    </OperationsPageTemplate>
  );
}
