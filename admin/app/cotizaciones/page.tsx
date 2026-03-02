import { Suspense } from "react";
import { FileText } from "lucide-react";

import { QuotesTableLoader } from "@/components/cotizaciones/quotes-table-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { getQuotesFeed } from "@/lib/admin-data";

async function QuotesTableSection() {
  const feed = await getQuotesFeed();

  return (
    <QuotesTableLoader
      initialQuotes={feed.quotes}
      source={feed.source}
      sourceMessage={feed.message}
      createEnabled={Boolean(process.env.N8N_CREATE_QUOTE_URL)}
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
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
          <FileText className="h-8 w-8 text-brand-gold" />
          Cotizaciones y Contratos
        </h1>
        <p className="mt-1 text-sm text-brand-off-white/70">
          Control real de cotizaciones: crea leads, verifica la fuente conectada y ejecuta briefs o contratos sobre datos sincronizados.
        </p>
      </div>

      <Suspense fallback={<QuotesTableFallback />}>
        <QuotesTableSection />
      </Suspense>
    </div>
  );
}
