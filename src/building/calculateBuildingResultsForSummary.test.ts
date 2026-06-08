import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDING } from "./buildingContext";
import { calculateBuildingResultsForSummary } from "./calculateBuildingResultsForSummary";

describe("calculate building results for summary", () => {
  it("publishes core building module results from shared building input", () => {
    const { results, errors, roofLoad } = calculateBuildingResultsForSummary(DEFAULT_BUILDING);

    expect(errors).toEqual([]);
    expect(roofLoad.total_kPa).toBeGreaterThan(0);
    expect(results.column?.edge ?? results.column?.fachwerk).not.toBeNull();
    expect(results.truss?.totalMass_kg).toBeGreaterThan(0);
    expect(results.purlin?.totalMass_kg).toBeGreaterThan(0);
    expect(results.beamCell?.totalMass_kg).toBeGreaterThan(0);
    expect(results.windowRiegel?.totalMass_kg).toBeGreaterThan(0);
    expect(results.craneBeam).toBeNull();
  });
});
