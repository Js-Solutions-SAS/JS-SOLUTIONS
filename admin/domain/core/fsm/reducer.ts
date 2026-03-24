export type GuardReducer<TState, TEvent extends { type: string }> = (
  state: TState,
  event: TEvent,
) => TState;

export function createGuardedReducer<TState, TEvent extends { type: string }>(
  reducer: GuardReducer<TState, TEvent>,
): GuardReducer<TState, TEvent> {
  return (state, event) => reducer(state, event);
}
