"use client";

import { create } from "zustand";
import type { SortingState } from "@tanstack/react-table";

import type { Quote } from "@/lib/types";

export type QuoteOperation =
  | "requestBrief"
  | "previewQuote"
  | "generateQuote"
  | "generateContract";

interface OperationStatus {
  loading: boolean;
  error?: string;
}

type QuoteOperationStatus = Record<QuoteOperation, OperationStatus>;

interface CotizacionesState {
  quotes: Quote[];
  search: string;
  industry: string;
  sorting: SortingState;
  selectedQuoteId: string | null;
  feedbackByQuoteId: Record<string, string>;
  opsByQuoteId: Record<string, QuoteOperationStatus>;
  initializeFromQuotes: (quotes: Quote[]) => void;
  setSearch: (value: string) => void;
  setIndustry: (value: string) => void;
  setSorting: (value: SortingState) => void;
  setSelectedQuoteId: (value: string | null) => void;
  setQuoteFeedback: (quoteId: string, feedback: string) => void;
  patchQuote: (quoteId: string, patch: Partial<Quote>) => void;
  setOperationStatus: (
    quoteId: string,
    operation: QuoteOperation,
    status: OperationStatus,
  ) => void;
}

function emptyOperations(): QuoteOperationStatus {
  return {
    requestBrief: { loading: false },
    previewQuote: { loading: false },
    generateQuote: { loading: false },
    generateContract: { loading: false },
  };
}

function buildInitialFeedback(quotes: Quote[]): Record<string, string> {
  return quotes.reduce<Record<string, string>>((acc, quote) => {
    if (quote.quoteLastFeedback) {
      acc[quote.id] = quote.quoteLastFeedback;
    }

    return acc;
  }, {});
}

export const useCotizacionesStore = create<CotizacionesState>((set) => ({
  quotes: [],
  search: "",
  industry: "Todas",
  sorting: [],
  selectedQuoteId: null,
  feedbackByQuoteId: {},
  opsByQuoteId: {},
  initializeFromQuotes: (quotes) =>
    set((state) => {
      const currentIds = new Set(quotes.map((quote) => quote.id));
      const nextFeedback = { ...state.feedbackByQuoteId };
      const seededFeedback = buildInitialFeedback(quotes);

      for (const quote of quotes) {
        if (!nextFeedback[quote.id] && seededFeedback[quote.id]) {
          nextFeedback[quote.id] = seededFeedback[quote.id];
        }
      }

      for (const existingId of Object.keys(nextFeedback)) {
        if (!currentIds.has(existingId)) {
          delete nextFeedback[existingId];
        }
      }

      const nextOps: Record<string, QuoteOperationStatus> = {};
      for (const quote of quotes) {
        nextOps[quote.id] = state.opsByQuoteId[quote.id] || emptyOperations();
      }

      const selectedQuoteId =
        state.selectedQuoteId && currentIds.has(state.selectedQuoteId)
          ? state.selectedQuoteId
          : null;

      return {
        quotes,
        feedbackByQuoteId: nextFeedback,
        opsByQuoteId: nextOps,
        selectedQuoteId,
      };
    }),
  setSearch: (search) => set({ search }),
  setIndustry: (industry) => set({ industry }),
  setSorting: (sorting) => set({ sorting }),
  setSelectedQuoteId: (selectedQuoteId) => set({ selectedQuoteId }),
  setQuoteFeedback: (quoteId, feedback) =>
    set((state) => ({
      feedbackByQuoteId: {
        ...state.feedbackByQuoteId,
        [quoteId]: feedback,
      },
    })),
  patchQuote: (quoteId, patch) =>
    set((state) => ({
      quotes: state.quotes.map((quote) =>
        quote.id === quoteId
          ? {
              ...quote,
              ...patch,
            }
          : quote,
      ),
    })),
  setOperationStatus: (quoteId, operation, status) =>
    set((state) => {
      const currentQuoteOps = state.opsByQuoteId[quoteId] || emptyOperations();

      return {
        opsByQuoteId: {
          ...state.opsByQuoteId,
          [quoteId]: {
            ...currentQuoteOps,
            [operation]: {
              loading: status.loading,
              error: status.error,
            },
          },
        },
      };
    }),
}));
