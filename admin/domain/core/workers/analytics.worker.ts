/// <reference lib="webworker" />

import {
  handleAggregate,
  handleFilterSort,
  type AggregatePayload,
  type FilterSortPayload,
  type WorkerPayload,
} from "./analytics.worker.logic";

interface WorkerRequest {
  type: string;
  requestId: string;
  payload: WorkerPayload;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { requestId, type, payload } = event.data;

  try {
    if (payload.action === "filter_sort") {
      const result = handleFilterSort(payload as FilterSortPayload<Record<string, unknown>>);
      self.postMessage({
        type: `${type.replace("REQUEST", "RESULT")}`,
        requestId,
        payload: result,
      });
      return;
    }

    if (payload.action === "aggregate") {
      const result = handleAggregate(payload as AggregatePayload<Record<string, unknown>>);
      self.postMessage({
        type: `${type.replace("REQUEST", "RESULT")}`,
        requestId,
        payload: result,
      });
      return;
    }

    self.postMessage({
      type: `${type.replace("REQUEST", "ERROR")}`,
      requestId,
      error: "Acción no soportada por worker.",
    });
  } catch (error) {
    self.postMessage({
      type: `${type.replace("REQUEST", "ERROR")}`,
      requestId,
      error: error instanceof Error ? error.message : "Error inesperado en worker.",
    });
  }
};
