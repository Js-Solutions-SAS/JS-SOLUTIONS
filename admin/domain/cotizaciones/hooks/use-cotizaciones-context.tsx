"use client";

import { type PropsWithChildren, useEffect, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";
import type { SortingState } from "@tanstack/react-table";

import { createSplitContext } from "@/domain/core/context/create-split-context";
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

interface CotizacionesContextValue {
  quotes: Quote[];
  search: string;
  industry: string;
  sorting: SortingState;
  selectedQuoteId: string | null;
  feedbackByQuoteId: Record<string, string>;
  opsByQuoteId: Record<string, QuoteOperationStatus>;
}

type CotizacionesEvent =
  | { type: "INIT_QUOTES"; quotes: Quote[] }
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_INDUSTRY"; value: string }
  | { type: "SET_SORTING"; value: SortingState }
  | { type: "SET_SELECTED_QUOTE_ID"; value: string | null }
  | { type: "SET_QUOTE_FEEDBACK"; quoteId: string; feedback: string }
  | { type: "PATCH_QUOTE"; quoteId: string; patch: Partial<Quote> }
  | {
      type: "SET_OPERATION_STATUS";
      quoteId: string;
      operation: QuoteOperation;
      status: OperationStatus;
    };

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

const cotizacionesMachine = createMachine(
  {
    types: {} as {
      context: CotizacionesContextValue;
      events: CotizacionesEvent;
    },
    id: "cotizaciones_machine",
    initial: "ready",
    context: {
      quotes: [],
      search: "",
      industry: "Todas",
      sorting: [],
      selectedQuoteId: null,
      feedbackByQuoteId: {},
      opsByQuoteId: {},
    },
    states: {
      ready: {
        on: {
          INIT_QUOTES: {
            actions: assign(({ context, event }) => {
              if (event.type !== "INIT_QUOTES") return {};

              const currentIds = new Set(event.quotes.map((quote) => quote.id));
              const nextFeedback = { ...context.feedbackByQuoteId };
              const seededFeedback = buildInitialFeedback(event.quotes);

              for (const quote of event.quotes) {
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
              for (const quote of event.quotes) {
                nextOps[quote.id] = context.opsByQuoteId[quote.id] || emptyOperations();
              }

              const selectedQuoteId =
                context.selectedQuoteId && currentIds.has(context.selectedQuoteId)
                  ? context.selectedQuoteId
                  : null;

              return {
                quotes: event.quotes,
                feedbackByQuoteId: nextFeedback,
                opsByQuoteId: nextOps,
                selectedQuoteId,
              };
            }),
          },
          SET_SEARCH: {
            actions: assign(({ event }) =>
              event.type === "SET_SEARCH" ? { search: event.value } : {},
            ),
          },
          SET_INDUSTRY: {
            actions: assign(({ event }) =>
              event.type === "SET_INDUSTRY" ? { industry: event.value } : {},
            ),
          },
          SET_SORTING: {
            actions: assign(({ event }) =>
              event.type === "SET_SORTING" ? { sorting: event.value } : {},
            ),
          },
          SET_SELECTED_QUOTE_ID: {
            actions: assign(({ event }) =>
              event.type === "SET_SELECTED_QUOTE_ID"
                ? { selectedQuoteId: event.value }
                : {},
            ),
          },
          SET_QUOTE_FEEDBACK: {
            actions: assign(({ context, event }) => {
              if (event.type !== "SET_QUOTE_FEEDBACK") return {};

              return {
                feedbackByQuoteId: {
                  ...context.feedbackByQuoteId,
                  [event.quoteId]: event.feedback,
                },
              };
            }),
          },
          PATCH_QUOTE: {
            actions: assign(({ context, event }) => {
              if (event.type !== "PATCH_QUOTE") return {};

              return {
                quotes: context.quotes.map((quote) =>
                  quote.id === event.quoteId
                    ? {
                        ...quote,
                        ...event.patch,
                      }
                    : quote,
                ),
              };
            }),
          },
          SET_OPERATION_STATUS: {
            actions: assign(({ context, event }) => {
              if (event.type !== "SET_OPERATION_STATUS") return {};

              const currentQuoteOps =
                context.opsByQuoteId[event.quoteId] || emptyOperations();

              return {
                opsByQuoteId: {
                  ...context.opsByQuoteId,
                  [event.quoteId]: {
                    ...currentQuoteOps,
                    [event.operation]: {
                      loading: event.status.loading,
                      error: event.status.error,
                    },
                  },
                },
              };
            }),
          },
        },
      },
    },
  },
);

const split = createSplitContext<CotizacionesContextValue, (event: CotizacionesEvent) => void>(
  "Cotizaciones",
);

export function CotizacionesProvider({
  initialQuotes,
  children,
}: PropsWithChildren<{ initialQuotes: Quote[] }>) {
  const [state, send] = useMachine(cotizacionesMachine);

  useEffect(() => {
    send({
      type: "INIT_QUOTES",
      quotes: initialQuotes,
    });
  }, [initialQuotes, send]);

  const contextValue = useMemo(() => state.context, [state.context]);

  return (
    <split.StateContext.Provider value={contextValue}>
      <split.DispatchContext.Provider value={send}>{children}</split.DispatchContext.Provider>
    </split.StateContext.Provider>
  );
}

export const useCotizacionesState = split.useStateContext;
export const useCotizacionesDispatch = split.useDispatchContext;
