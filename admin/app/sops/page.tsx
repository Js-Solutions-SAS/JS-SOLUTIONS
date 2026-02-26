import { Suspense } from "react";
import { BookOpen } from "lucide-react";

import { SopsBentoClient } from "@/components/sops/sops-bento-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getSops } from "@/lib/admin-data";

async function SopsSection() {
  const sops = await getSops();
  return <SopsBentoClient initialSops={sops} />;
}

function SopsFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-white/10 bg-brand-charcoal/90 p-5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-4 h-6 w-52" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-10/12" />
          <Skeleton className="mt-8 h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export default function SopsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
          <BookOpen className="h-8 w-8 text-brand-gold" />
          SOPs y Recursos
        </h1>
        <p className="mt-1 text-sm text-brand-off-white/70">
          Base de conocimiento operativa en formato bento para exploracion rapida por categoria.
        </p>
      </div>

      <Suspense fallback={<SopsFallback />}>
        <SopsSection />
      </Suspense>
    </div>
  );
}
