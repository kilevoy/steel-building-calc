import { describe, expect, it } from "vitest";
import { DEFAULT_COLUMN_INPUT } from "../defaults/columnInput";
import { runCalculation } from "./engine";

describe("column engine smoke test", () => {
  it("returns non-empty results for default input", () => {
    const result = runCalculation(DEFAULT_COLUMN_INPUT);

    expect(result.results.length).toBeGreaterThan(0);
  });
});
