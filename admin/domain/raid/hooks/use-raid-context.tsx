"use client";

import { type PropsWithChildren, useMemo } from "react";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";

import { createSplitContext } from "@/domain/core/context/create-split-context";

interface RaidContextValue {
  projectFilter: string;
  typeFilter: string;
  statusFilter: string;
  ownerFilter: string;
}

type RaidEvent =
  | { type: "SET_PROJECT_FILTER"; value: string }
  | { type: "SET_TYPE_FILTER"; value: string }
  | { type: "SET_STATUS_FILTER"; value: string }
  | { type: "SET_OWNER_FILTER"; value: string };

const raidMachine = createMachine({
  types: {} as {
    context: RaidContextValue;
    events: RaidEvent;
  },
  id: "raid_machine",
  initial: "ready",
  context: {
    projectFilter: "Todos",
    typeFilter: "Todos",
    statusFilter: "Todos",
    ownerFilter: "Todos",
  },
  states: {
    ready: {
      on: {
        SET_PROJECT_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_PROJECT_FILTER" ? { projectFilter: event.value } : {},
          ),
        },
        SET_TYPE_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_TYPE_FILTER" ? { typeFilter: event.value } : {},
          ),
        },
        SET_STATUS_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_STATUS_FILTER" ? { statusFilter: event.value } : {},
          ),
        },
        SET_OWNER_FILTER: {
          actions: assign(({ event }) =>
            event.type === "SET_OWNER_FILTER" ? { ownerFilter: event.value } : {},
          ),
        },
      },
    },
  },
});

const split = createSplitContext<RaidContextValue, (event: RaidEvent) => void>("RAID");

export function RaidProvider({ children }: PropsWithChildren) {
  const [state, send] = useMachine(raidMachine);
  const contextValue = useMemo(() => state.context, [state.context]);

  return (
    <split.StateContext.Provider value={contextValue}>
      <split.DispatchContext.Provider value={send}>{children}</split.DispatchContext.Provider>
    </split.StateContext.Provider>
  );
}

export const useRaidState = split.useStateContext;
export const useRaidDispatch = split.useDispatchContext;
