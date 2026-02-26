"use client";

import dynamic from "next/dynamic";

import type { Quote } from "@/lib/types";

interface QuotesTableLoaderProps {
  initialQuotes: Quote[];
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
}: QuotesTableLoaderProps) {
  return <QuotesTable initialQuotes={initialQuotes} />;
}
