import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";

import { RaidBoard } from "@/components/raid/raid-board";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
          <ShieldCheck className="h-8 w-8 text-brand-gold" />
          RAID Log
        </h1>
        <p className="mt-1 text-sm text-brand-off-white/70">
          Riesgos, supuestos, issues y dependencias por proyecto en una sola vista operativa.
        </p>
      </div>

      <Suspense fallback={<RaidFallback />}>
        <RaidSection />
      </Suspense>
    </div>
  );
}
