import { describe, expect, it } from "vitest";
import { buildBeamCellResultItem } from "../beamCellResultPublisher";
import type { MemberSolution } from "../calc/beamCell/types";
import type { BuildingResults } from "./resultsContext";
import { buildSummaryRows } from "./summaryRows";
import { calculateBuildingSummaryTotals } from "./summaryTotals";

function solution(): MemberSolution {
  return {
    status: "OK",
    material: "C245",
    profile: "40 Б2",
    weightKg: 792,
    costRub: 153_000,
    utilization: 0.8,
  };
}

describe("beam cell summary contract", () => {
  it("carries gable end roof beam count and slope length into summary rows and totals", () => {
    const beamCell = buildBeamCellResultItem({
      solution: solution(),
      length_m: 72,
      framePitch_m: 6,
      span_m: 24,
      roofSlope_deg: 5,
      roofShape: "gable",
      spanCount: "single",
    });
    const results: BuildingResults = {
      column: null,
      truss: null,
      purlin: null,
      beamCell,
      windowRiegel: null,
      craneBeam: null,
    };
    const lengthPerPiece = 12 / Math.cos((5 * Math.PI) / 180);

    expect(buildSummaryRows(results)[0]).toMatchObject({
      label: "Торцевая балка покрытия",
      count: "4",
      lengthPerPiece_m: `${lengthPerPiece.toFixed(2)} м`,
      totalLength_m: `${(lengthPerPiece * 4).toFixed(2)} м`,
      unitMass_kg: "792.0 кг",
      totalMass_kg: 792 * 4,
      cost_rub: 153_000 * 4,
      details: "торцы, 2 ската",
    });
    expect(calculateBuildingSummaryTotals(results)).toEqual({
      totalMass_kg: 792 * 4,
      totalCost_rub: 153_000 * 4,
    });
  });
});
