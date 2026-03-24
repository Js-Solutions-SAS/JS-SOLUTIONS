import { describe, expect, it } from "vitest";

import {
  handleAggregate,
  handleFilterSort,
} from "@/domain/core/workers/analytics.worker.logic";

describe("analytics.worker.logic", () => {
  it("filtra por query y filtros", () => {
    const result = handleFilterSort({
      action: "filter_sort",
      items: [
        { id: "1", projectName: "Alpha", status: "Pending" },
        { id: "2", projectName: "Beta", status: "Approved" },
      ],
      query: "alp",
      fields: ["projectName"],
      filters: {
        status: "Pending",
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("1");
  });

  it("agrega por llave", () => {
    const result = handleAggregate({
      action: "aggregate",
      items: [
        { industry: "Retail" },
        { industry: "Retail" },
        { industry: "Public Sector" },
      ],
      key: "industry",
    });

    expect(result).toEqual({
      Retail: 2,
      "Public Sector": 1,
    });
  });
});
