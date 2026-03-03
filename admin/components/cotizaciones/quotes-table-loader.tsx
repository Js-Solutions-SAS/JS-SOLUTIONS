"use client";

import dynamic from "next/dynamic";

import type { Quote, QuotesFeedSource } from "@/lib/types";

interface QuotesTableLoaderProps {
  initialQuotes: Quote[];
  source: QuotesFeedSource;
  sourceMessage: string;
  createEnabled: boolean;
}

const QuotesTable = dynamic(
  () =>
    import("@/components/cotizaciones/quotes-table").then(
      (module) => module.QuotesTable,
    ),
  {
    ssr: false,
  },
);

export function QuotesTableLoader({
  initialQuotes,
  source,
  sourceMessage,
  createEnabled,
}: QuotesTableLoaderProps) {
  const tableKey = `${source}:${initialQuotes
    .map(
      (quote) =>
        [
          quote.id,
          quote.estado,
          quote.briefUrl || "",
          quote.quotePdfUrl || "",
          quote.quoteStatus || "",
          quote.contractUrl || "",
        ].join(":"),
    )
    .join("|")}`;

  return (
    <QuotesTable
      key={tableKey}
      initialQuotes={initialQuotes}
      source={source}
      sourceMessage={sourceMessage}
      createEnabled={createEnabled}
    />
  );
}
