import { describe, expect, it } from "vitest";
import type { CraneCalculationResult } from "../calc/craneBeam/types";
import { buildCraneBeamResultItem } from "./craneBeamResultPublisher";
import type { BuildingResults } from "./resultsContext";
import { buildSummaryRows } from "./summaryRows";
import { calculateBuildingSummaryTotals } from "./summaryTotals";

function result(): CraneCalculationResult {
  return {
    profile: "30К1",
    utilizationPercent: 79.58,
    weightKg: 522.00147,
    wheelLoadKn: 95,
    trolleyMassT: null,
    craneBaseMm: 4400,
    craneGaugeMm: 5400,
    railFootWidthM: null,
    railHeightM: null,
    ribStepSelectedM: 6,
    dimensions: [],
    geometry: [],
    strength: [],
    crane78: [],
    globalStability: [],
    localStability: [],
    deflections: [],
    warnings: [],
  };
}

describe("crane beam summary contract", () => {
  it("carries two-line runway quantity into summary rows and totals", () => {
    const craneBeam = buildCraneBeamResultItem(result(), {
      buildingLength_m: 72,
      beamSpan_m: 6,
      priceC345_rubKg: 141,
    });
    const results: BuildingResults = {
      column: null,
      truss: null,
      purlin: null,
      beamCell: null,
      windowRiegel: null,
      craneBeam,
    };

    expect(buildSummaryRows(results)[0]).toMatchObject({
      label: "Подкрановая балка",
      count: "24",
      lengthPerPiece_m: "6.00 м",
      totalLength_m: "144.00 м",
      unitMass_kg: "522.0 кг",
      totalMass_kg: 522.00147 * 24,
      cost_rub: 522.00147 * 24 * 141,
      note: "2 нитки подкранового пути",
    });
    expect(calculateBuildingSummaryTotals(results)).toEqual({
      totalMass_kg: 522.00147 * 24,
      totalCost_rub: 522.00147 * 24 * 141,
    });
  });
});
