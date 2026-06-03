import { describe, expect, it } from "vitest";
import type { BuildingResults, ResultItem } from "./resultsContext";
import { buildSummaryRows } from "./summaryRows";
import {
  calculateBuildingSummaryTotals,
  calculateBuildingSummaryTotalsBySteel,
} from "./summaryTotals";

function item(params: {
  profile: string;
  steel: string;
  totalMass_kg: number;
  cost_rub: number;
  count?: number;
  massPerPiece_kg?: number;
}): ResultItem {
  return params;
}

describe("building summary contract", () => {
  it("keeps all module publishers visible in the final building summary", () => {
    const results: BuildingResults = {
      column: {
        edge: item({
          profile: "35 Б1",
          steel: "С345",
          count: 22,
          massPerPiece_kg: 720,
          totalMass_kg: 15_840,
          cost_rub: 2_460_000,
        }),
        middle: item({
          profile: "40 К1",
          steel: "С345",
          count: 11,
          massPerPiece_kg: 900,
          totalMass_kg: 9_900,
          cost_rub: 1_540_000,
        }),
        fachwerk: item({
          profile: "кв.160х5",
          steel: "С245",
          count: 6,
          massPerPiece_kg: 220,
          totalMass_kg: 1_320,
          cost_rub: 171_864,
        }),
      },
      truss: {
        sections: [
          { section: "ВП", profile: "кв.180х5", steel: "С345", totalMass_kg: 4_000 },
          { section: "НП", profile: "кв.160х5", steel: "С345", totalMass_kg: 3_000 },
          { section: "ОР", profile: "кв.120х4", steel: "С345", totalMass_kg: 2_000 },
        ],
        totalMass_kg: 9_000,
        totalCost_rub: 1_402_920,
        unitMass_kg_per_m2: 18.5,
        n_trusses: 11,
      },
      purlin: item({
        profile: "Z 350х2",
        steel: "МП350",
        totalMass_kg: 12_126.4,
        cost_rub: 2_182_752,
      }),
      beamCell: item({
        profile: "40 Б2",
        steel: "С245",
        count: 2,
        massPerPiece_kg: 792,
        totalMass_kg: 1_584,
        cost_rub: 306_000,
      }),
      windowRiegel: item({
        profile: "кв.120х4",
        steel: "С245",
        count: 1,
        massPerPiece_kg: 87.0017,
        totalMass_kg: 87.0017,
        cost_rub: 0,
      }),
      craneBeam: item({
        profile: "30К1",
        steel: "С345",
        count: 1,
        massPerPiece_kg: 522.00147,
        totalMass_kg: 522.00147,
        cost_rub: 0,
      }),
    };

    const rows = buildSummaryRows(results);

    expect(rows.map((row) => row.label)).toEqual([
      "Колонна крайняя",
      "Колонна средняя",
      "Колонна фахверк",
      "Ферма покрытия",
      "Прогоны (ЛСТК)",
      "Торцевая балка покрытия",
      "Оконные ригели (★ top‑1)",
      "Подкрановая балка",
    ]);
    const totals = calculateBuildingSummaryTotals(results);
    expect(totals.totalMass_kg).toBeCloseTo(50_379.40317, 8);
    expect(totals.totalCost_rub).toBe(8_063_536);
    expect(calculateBuildingSummaryTotalsBySteel(results)).toEqual([
      { steel: "С345", totalMass_kg: 35_262.00147, totalCost_rub: 5_402_920 },
      { steel: "МП350", totalMass_kg: 12_126.4, totalCost_rub: 2_182_752 },
      { steel: "С245", totalMass_kg: 2_991.0017, totalCost_rub: 477_864 },
    ]);
  });
});
