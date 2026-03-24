export interface FilterSortPayload<TItem = Record<string, unknown>> {
  action: "filter_sort";
  items: TItem[];
  query: string;
  fields: string[];
  filters?: Record<string, string | undefined>;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface AggregatePayload<TItem = Record<string, unknown>> {
  action: "aggregate";
  items: TItem[];
  key: string;
}

export type WorkerPayload = FilterSortPayload | AggregatePayload;

export function normalizeString(value: unknown): string {
  return String(value ?? "").toLowerCase();
}

export function resolveField(item: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = item;

  for (const segment of segments) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

export function handleFilterSort(payload: FilterSortPayload<Record<string, unknown>>) {
  const query = normalizeString(payload.query).trim();

  let result = payload.items.filter((item) => {
    if (payload.filters) {
      for (const [filterKey, filterValue] of Object.entries(payload.filters)) {
        if (!filterValue || filterValue === "Todos" || filterValue === "Todas") {
          continue;
        }

        const value = resolveField(item, filterKey);
        if (String(value ?? "") !== filterValue) {
          return false;
        }
      }
    }

    if (!query) {
      return true;
    }

    return payload.fields.some((field) => {
      const value = resolveField(item, field);
      return normalizeString(value).includes(query);
    });
  });

  if (payload.sortBy) {
    const direction = payload.sortDirection === "desc" ? -1 : 1;
    result = [...result].sort((a, b) => {
      const left = resolveField(a, payload.sortBy!);
      const right = resolveField(b, payload.sortBy!);
      const leftString = normalizeString(left);
      const rightString = normalizeString(right);

      if (leftString < rightString) return -1 * direction;
      if (leftString > rightString) return 1 * direction;
      return 0;
    });
  }

  return result;
}

export function handleAggregate(payload: AggregatePayload<Record<string, unknown>>) {
  return payload.items.reduce<Record<string, number>>((accumulator, item) => {
    const key = String(resolveField(item, payload.key) ?? "unknown");
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}
