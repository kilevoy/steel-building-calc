import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDING } from "./buildingContext";
import { buildSummaryAutoCalculationKey } from "./summaryAutoCalculationKey";

describe("summary auto calculation key", () => {
  it("stays stable for the same building input", () => {
    expect(buildSummaryAutoCalculationKey(DEFAULT_BUILDING)).toBe(
      buildSummaryAutoCalculationKey({ ...DEFAULT_BUILDING }),
    );
  });

  it("changes when engineering input changes", () => {
    expect(buildSummaryAutoCalculationKey({
      ...DEFAULT_BUILDING,
      span_m: DEFAULT_BUILDING.span_m + 6,
    })).not.toBe(buildSummaryAutoCalculationKey(DEFAULT_BUILDING));
  });

  it("changes when summary accounting choices change", () => {
    expect(buildSummaryAutoCalculationKey({
      ...DEFAULT_BUILDING,
      purlinContinuityScheme: "continuous",
    })).not.toBe(buildSummaryAutoCalculationKey(DEFAULT_BUILDING));
  });
});
