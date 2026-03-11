import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

import { QuotesTableLoader } from "@/components/organisms/cotizaciones/quotes-table-loader";
import { OperationsPageTemplate } from "@/components/templates/operations-page-template";
import { Skeleton } from "@/components/atoms/skeleton";
import { getQuotesFeed } from "@/lib/admin-data";

async function QuotesTableSection() {
  const feed = await getQuotesFeed();

  return (
    <QuotesTableLoader
      initialQuotes={feed.quotes}
      source={feed.source}
      sourceMessage={feed.message}
      createEnabled={Boolean(process.env.API_BASE_URL)}
    />
  );
}

function QuotesTableFallback() {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-brand-charcoal/90 p-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function CotizacionesPage() {
  return (
    <OperationsPageTemplate
      title="Cotizaciones y Contratos"
      description="Control real de cotizaciones: crea leads, verifica la fuente conectada y ejecuta briefs o contratos sobre datos sincronizados."
      icon={FileText}
      fallback={<QuotesTableFallback />}
    >
        <QuotesTableSection />
    </OperationsPageTemplate>
  );
}
