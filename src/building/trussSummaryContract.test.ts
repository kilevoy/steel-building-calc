import { describe, expect, it } from "vitest";
import type { TrussResult } from "./resultsContext";
import type { BuildingResults } from "./resultsContext";
import { buildSummaryRows } from "./summaryRows";
import { calculateBuildingSummaryTotals } from "./summaryTotals";

function emptyResults(truss: TrussResult): BuildingResults {
  return {
    column: null,
    truss,
    purlin: null,
    beamCell: null,
    windowRiegel: null,
    craneBeam: null,
  };
}

describe("truss summary contract", () => {
  it("shows interior-frame count, truss length and unit mass in the summary row", () => {
    const truss: TrussResult = {
      sections: [
        { section: "ВП", profile: "тр.200×160×6", steel: "С345", totalMass_kg: 4_000 },
        { section: "НП", profile: "тр.120×5", steel: "С345", totalMass_kg: 3_000 },
      ],
      totalMass_kg: 7_000,
      totalCost_rub: 987_000,
      unitMass_kg_per_m2: 18.54,
      n_trusses: 11,
      lengthPerPiece_m: 24,
      totalLength_m: 264,
      reactions: {
        V_perm_kN: 90,
        V_snow_kN: 180,
        V_wind_kN: 45,
        H_kN: null,
      },
    };
    const results = emptyResults(truss);

    expect(buildSummaryRows(results)[0]).toMatchObject({
      label: "Ферма покрытия",
      profile: "ВП: тр.200×160×6 / НП: тр.120×5",
      steel: "С345",
      count: "11",
      lengthPerPiece_m: "24.00 м",
      totalLength_m: "264.00 м",
      unitMass_kg: "636.4 кг",
      totalMass_kg: 7_000,
      cost_rub: 987_000,
      note: "внутренние рамы, 18.5 кг/м²",
    });
    expect(calculateBuildingSummaryTotals(results)).toEqual({
      totalMass_kg: 7_000,
      totalCost_rub: 987_000,
    });
  });
});
