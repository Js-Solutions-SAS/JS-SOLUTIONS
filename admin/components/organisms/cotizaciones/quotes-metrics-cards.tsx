import { QuoteIntakeForm } from "@/components/organisms/cotizaciones/quote-intake-form";
import { Badge } from "@/components/atoms/badge";
import { Card, CardContent } from "@/components/molecules/card";
import type { Quote, QuotesFeedSource } from "@/lib/types";

import { sourceLabel, sourceTone } from "./quotes-table-helpers";

interface QuotesMetricsCardsProps {
  quotes: Quote[];
  source: QuotesFeedSource;
  sourceMessage: string;
  createEnabled: boolean;
}

export function QuotesMetricsCards({
  quotes,
  source,
  sourceMessage,
  createEnabled,
}: QuotesMetricsCardsProps) {
  const withEmailCount = quotes.filter((quote) => Boolean(quote.email)).length;
  const withoutEmailCount = quotes.length - withEmailCount;
  const withBriefCount = quotes.filter((quote) => Boolean(quote.briefCompletedAt)).length;
  const withQuoteCount = quotes.filter((quote) => Boolean(quote.quotePdfUrl)).length;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Estado de sincronizacion</h2>
              <p className="mt-1 text-sm text-brand-off-white/70">{sourceMessage}</p>
            </div>
            <Badge tone={sourceTone(source)}>{sourceLabel(source)}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                Total visibles
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{quotes.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                Con email
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{withEmailCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                Brief completo
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{withBriefCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                Sin email
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{withoutEmailCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                Cotización lista
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{withQuoteCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuoteIntakeForm enabled={createEnabled} />
    </div>
  );
}
