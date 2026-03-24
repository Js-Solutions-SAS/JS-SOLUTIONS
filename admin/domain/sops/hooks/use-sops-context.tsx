"use client";

import { type PropsWithChildren, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

import { createSplitContext } from "@/domain/core/context/create-split-context";

interface SopsContextValue {
  search: string;
  category: string;
}

type SopsEvent =
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_CATEGORY"; value: string };

const sopsMachine = createMachine({
  types: {} as {
    context: SopsContextValue;
    events: SopsEvent;
  },
  id: "sops_machine",
  initial: "ready",
  context: {
    search: "",
    category: "Todas",
  },
  states: {
    ready: {
      on: {
        SET_SEARCH: {
          actions: assign(({ event }) =>
            event.type === "SET_SEARCH" ? { search: event.value } : {},
          ),
        },
        SET_CATEGORY: {
          actions: assign(({ event }) =>
            event.type === "SET_CATEGORY" ? { category: event.value } : {},
          ),
        },
      },
    },
  },
});

const split = createSplitContext<SopsContextValue, (event: SopsEvent) => void>("SOPs");

export function SopsProvider({ children }: PropsWithChildren) {
  const [state, send] = useMachine(sopsMachine);
  const contextValue = useMemo(() => state.context, [state.context]);

  return (
    <split.StateContext.Provider value={contextValue}>
      <split.DispatchContext.Provider value={send}>{children}</split.DispatchContext.Provider>
    </split.StateContext.Provider>
  );
}

export const useSopsState = split.useStateContext;
export const useSopsDispatch = split.useDispatchContext;
