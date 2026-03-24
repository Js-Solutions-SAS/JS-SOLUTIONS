import { createMachine } from "xstate";

export interface DomainMachineTemplate<
  TContext extends Record<string, unknown>,
  TEvent extends { type: string },
> {
  id: string;
  context: TContext;
  events: TEvent;
  guards?: Record<string, unknown>;
  services?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  actors?: Record<string, unknown>;
}

export function createDomainMachine<
  TContext extends Record<string, unknown>,
  TEvent extends { type: string },
>(template: DomainMachineTemplate<TContext, TEvent>) {
  return createMachine({
    types: {} as {
      context: TContext;
      events: TEvent;
    },
    id: template.id,
    initial: "ready",
    context: template.context,
    states: {
      ready: {},
    },
  });
}
