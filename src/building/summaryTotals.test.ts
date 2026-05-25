import { describe, expect, it } from "vitest";
import type { BuildingResults, ResultItem } from "./resultsContext";
import {
  calculateBuildingSummaryTotals,
  calculateBuildingSummaryTotalsBySteel,
} from "./summaryTotals";

function item(
  steel: string,
  totalMass_kg: number,
  cost_rub: number,
  profile = "test",
): ResultItem {
  return {
    profile,
    steel,
    totalMass_kg,
    cost_rub,
  };
}

const emptyResults: BuildingResults = {
  column: null,
  truss: null,
  purlin: null,
  beamCell: null,
  windowRiegel: null,
  craneBeam: null,
};

describe("building summary totals", () => {
  it("returns zero totals when no modules published results", () => {
    expect(calculateBuildingSummaryTotals(emptyResults)).toEqual({
      totalMass_kg: 0,
      totalCost_rub: 0,
    });
  });

  it("aggregates all published module totals once", () => {
    const results: BuildingResults = {
      column: {
        edge: item("C245", 100, 1_000),
        middle: item("C345", 200, 2_000),
        fachwerk: null,
      },
      truss: {
        sections: [
          { section: "top", profile: "T1", steel: "C245", totalMass_kg: 30 },
          { section: "bottom", profile: "T2", steel: "C345", totalMass_kg: 40 },
        ],
        totalMass_kg: 70,
        totalCost_rub: 700,
        unitMass_kg_per_m2: 12,
        n_trusses: 3,
      },
      purlin: item("MP350", 300, 3_000),
      beamCell: item("C245", 400, 4_000),
      windowRiegel: item("C245", 50, 0),
      craneBeam: item("C345", 60, 0),
    };

    expect(calculateBuildingSummaryTotals(results)).toEqual({
      totalMass_kg: 1_180,
      totalCost_rub: 10_700,
    });
  });

  it("aggregates steel totals using truss section breakdown", () => {
    const results: BuildingResults = {
      column: {
        edge: item("C245", 100, 1_000),
        middle: item("C345", 200, 2_000),
        fachwerk: item("C245", 25, 250),
      },
      truss: {
        sections: [
          { section: "top", profile: "T1", steel: "C245", totalMass_kg: 30 },
          { section: "bottom", profile: "T2", steel: "C345", totalMass_kg: 40 },
        ],
        totalMass_kg: 70,
        totalCost_rub: 700,
        unitMass_kg_per_m2: 12,
        n_trusses: 3,
      },
      purlin: item("MP350", 300, 3_000),
      beamCell: null,
      windowRiegel: null,
      craneBeam: item("C345", 60, 0),
    };

    expect(calculateBuildingSummaryTotalsBySteel(results)).toEqual([
      { steel: "C345", totalMass_kg: 300, totalCost_rub: 2_000 },
      { steel: "MP350", totalMass_kg: 300, totalCost_rub: 3_000 },
      { steel: "C245", totalMass_kg: 155, totalCost_rub: 1_250 },
    ]);
  });
});
