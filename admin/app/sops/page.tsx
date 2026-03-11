import { BookOpen } from "lucide-react";

import { SopsBentoClient } from "@/components/organisms/sops/sops-bento-client";
import { OperationsPageTemplate } from "@/components/templates/operations-page-template";
import { Skeleton } from "@/components/atoms/skeleton";
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
    <OperationsPageTemplate
      title="SOPs y Recursos"
      description="Base de conocimiento operativa en formato bento para exploracion rapida por categoria."
      icon={BookOpen}
      fallback={<SopsFallback />}
    >
        <SopsSection />
    </OperationsPageTemplate>
  );
}
