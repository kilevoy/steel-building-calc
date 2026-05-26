import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDING } from "./buildingContext";
import { applyAutoPurlinResult, calculateAutoPurlinResult } from "./autoPurlinResult";
import type { BuildingResults, ResultItem } from "./resultsContext";

describe("auto purlin result for building summary", () => {
  it("calculates a non-empty purlin result from shared building input", () => {
    const result = calculateAutoPurlinResult(DEFAULT_BUILDING);

    expect(result).not.toBeNull();
    expect(result?.profile).toContain("Z");
    expect(result?.totalMass_kg).toBeGreaterThan(0);
  });

  it("uses the accepted purlin branch selected in the shared building state", () => {
    const zResult = calculateAutoPurlinResult({
      ...DEFAULT_BUILDING,
      purlinSelectionMode: "Z",
    });
    const rolledResult = calculateAutoPurlinResult({
      ...DEFAULT_BUILDING,
      purlinSelectionMode: "rolled",
    });

    expect(zResult?.profile).toContain("Z");
    expect(zResult?.steel).toMatch(/^МП/);
    expect(rolledResult?.steel).toMatch(/^С/);
    expect(rolledResult?.profile).not.toContain("Z");
  });

  it("keeps an explicit purlin tab result when it already exists", () => {
    const explicit: ResultItem = {
      profile: "manual purlin",
      steel: "МП350",
      totalMass_kg: 123,
      cost_rub: 456,
    };
    const results: BuildingResults = {
      column: null,
      truss: null,
      purlin: explicit,
      beamCell: null,
      windowRiegel: null,
      craneBeam: null,
    };

    expect(applyAutoPurlinResult(results, DEFAULT_BUILDING).purlin).toBe(explicit);
  });
});
