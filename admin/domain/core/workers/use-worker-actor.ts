"use client";

import { useCallback, useEffect, useRef } from "react";

export interface WorkerRequest<TPayload = unknown> {
  type: string;
  requestId: string;
  payload: TPayload;
}

export interface WorkerSuccess<TPayload = unknown> {
  type: string;
  requestId: string;
  payload: TPayload;
}

export interface WorkerFailure {
  type: string;
  requestId: string;
  error: string;
}

export type WorkerResponse<TPayload = unknown> =
  | WorkerSuccess<TPayload>
  | WorkerFailure;

interface UseWorkerActorParams<TRequestPayload, TResponsePayload> {
  workerFactory: () => Worker;
  onMessage: (message: WorkerResponse<TResponsePayload>) => void;
  onFatalError?: (error: Error) => void;
}

export function useWorkerActor<TRequestPayload = unknown, TResponsePayload = unknown>(
  params: UseWorkerActorParams<TRequestPayload, TResponsePayload>,
) {
  const workerRef = useRef<Worker | null>(null);
  const onMessageRef = useRef(params.onMessage);
  const onFatalErrorRef = useRef(params.onFatalError);
  const workerFactoryRef = useRef(params.workerFactory);

  useEffect(() => {
    onMessageRef.current = params.onMessage;
  }, [params.onMessage]);

  useEffect(() => {
    onFatalErrorRef.current = params.onFatalError;
  }, [params.onFatalError]);

  useEffect(() => {
    const worker = workerFactoryRef.current();
    workerRef.current = worker;

    const onMessage = (event: MessageEvent<WorkerResponse<TResponsePayload>>) => {
      onMessageRef.current(event.data);
    };

    const onError = (event: ErrorEvent) => {
      onFatalErrorRef.current?.(new Error(event.message));
    };

    worker.addEventListener("message", onMessage as EventListener);
    worker.addEventListener("error", onError as EventListener);

    return () => {
      worker.removeEventListener("message", onMessage as EventListener);
      worker.removeEventListener("error", onError as EventListener);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const postMessage = useCallback(
    (request: WorkerRequest<TRequestPayload>) => {
      if (!workerRef.current) {
        return;
      }

      workerRef.current.postMessage(request);
    },
    [],
  );

  return {
    postMessage,
  };
}

export function createWorkerRequestId(prefix = "wrk"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
