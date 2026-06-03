import { describe, expect, it } from "vitest";
import type { WindowRiegelResult } from "../calc/windowRiegel/types";
import { buildWindowRiegelResultItem } from "../windowRiegelResultPublisher";
import type { BuildingResults } from "./resultsContext";
import { buildSummaryRows } from "./summaryRows";
import { calculateBuildingSummaryTotals } from "./summaryTotals";

function result(): WindowRiegelResult {
  return {
    verticalLoadKpa: 0.42,
    horizontalLoadKpa: 0.87,
    outOfPlaneLengthM: 6,
    inPlaneLengthM: 5,
    effectiveWindLoadKpa: 0.3,
    climateSettlement: null,
    lowerAndUpperProfiles: [{
      number: 1,
      profile: "кв.120×4",
      steel: "С245",
      weightKg: 87.0017,
    }],
    upperType1Profiles: [],
    warnings: [],
  };
}

describe("window riegel summary contract", () => {
  it("carries manual building count into summary rows and totals", () => {
    const windowRiegel = buildWindowRiegelResultItem(result(), {
      count: 12,
      priceC245_rubKg: 130.2,
    });
    const results: BuildingResults = {
      column: null,
      truss: null,
      purlin: null,
      beamCell: null,
      windowRiegel,
      craneBeam: null,
    };

    expect(buildSummaryRows(results)[0]).toMatchObject({
      label: "Оконные ригели (★ top‑1)",
      count: "12",
      unitMass_kg: "87.0 кг",
      totalMass_kg: 87.0017 * 12,
      cost_rub: 87.0017 * 12 * 130.2,
      details: "количество задано расчетчиком",
    });
    expect(calculateBuildingSummaryTotals(results)).toEqual({
      totalMass_kg: 87.0017 * 12,
      totalCost_rub: 87.0017 * 12 * 130.2,
    });
  });
});
