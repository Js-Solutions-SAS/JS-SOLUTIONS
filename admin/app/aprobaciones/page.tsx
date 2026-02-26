import { Suspense } from "react";
import { ClipboardCheck } from "lucide-react";

import { AprobacionesBoard } from "@/components/aprobaciones/aprobaciones-board";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
          <ClipboardCheck className="h-8 w-8 text-brand-gold" />
          Approvals
        </h1>
        <p className="mt-1 text-sm text-brand-off-white/70">
          Manage checkpoints for brief, scope, QA, UAT, contract, and scope changes.
        </p>
      </div>

      <Suspense fallback={<AprobacionesFallback />}>
        <AprobacionesSection />
      </Suspense>
    </div>
  );
}
