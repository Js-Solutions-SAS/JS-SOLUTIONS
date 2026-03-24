import { createContext, useContext } from "react";

export function createSplitContext<TState, TDispatch>(label: string) {
  const StateContext = createContext<TState | null>(null);
  const DispatchContext = createContext<TDispatch | null>(null);

  function useStateContext() {
    const value = useContext(StateContext);
    if (value === null) {
      throw new Error(`${label} StateContext missing provider`);
    }

    return value;
  }

  function useDispatchContext() {
    const value = useContext(DispatchContext);
    if (value === null) {
      throw new Error(`${label} DispatchContext missing provider`);
    }

    return value;
  }

  return {
    StateContext,
    DispatchContext,
    useStateContext,
    useDispatchContext,
  };
}
