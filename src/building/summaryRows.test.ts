import { describe, expect, it } from "vitest";
import type { BuildingResults, ResultItem } from "./resultsContext";
import { buildSummaryRows, formatSummaryCost, formatSummaryMass } from "./summaryRows";

function item(
  steel: string,
  totalMass_kg: number,
  cost_rub: number,
  count?: number,
  massPerPiece_kg?: number,
): ResultItem {
  return {
    profile: "test-profile",
    steel,
    count,
    massPerPiece_kg,
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

describe("summary rows", () => {
  it("formats mass and cost like summary UI", () => {
    expect(formatSummaryMass(Number.NaN)).toBe("—");
    expect(formatSummaryMass(950)).toBe("950.0 кг");
    expect(formatSummaryMass(1250)).toBe("1.25 т");

    expect(formatSummaryCost(0)).toBe("—");
    expect(formatSummaryCost(950)).toBe("950 ₽");
    expect(formatSummaryCost(1250)).toBe("1.25 тыс. ₽");
    expect(formatSummaryCost(1_250_000)).toBe("1.25 млн ₽");
  });

  it("returns no rows when no module has published a result", () => {
    expect(buildSummaryRows(emptyResults)).toEqual([]);
  });

  it("builds stable display rows for published module results", () => {
    const results: BuildingResults = {
      column: {
        edge: item("C245", 200, 2_000, 2, 100),
        middle: null,
        fachwerk: item("C245", 50, 500),
      },
      truss: {
        sections: [
          { section: "top", profile: "T1", steel: "C345", totalMass_kg: 30 },
          { section: "bottom", profile: "T2", steel: "C345", totalMass_kg: 40 },
        ],
        totalMass_kg: 70,
        totalCost_rub: 700,
        unitMass_kg_per_m2: 12.34,
        n_trusses: 2,
      },
      purlin: item("MP350", 300, 3_000),
      beamCell: null,
      windowRiegel: null,
      craneBeam: item("C345", 60, 0),
    };

    expect(buildSummaryRows(results)).toMatchObject([
      {
        label: "Колонна крайняя",
        steel: "C245",
        count: "2",
        unitMass_kg: "100.0 кг",
        totalMass_kg: 200,
      },
      {
        label: "Колонна фахверк",
        count: "—",
        unitMass_kg: "—",
        totalMass_kg: 50,
      },
      {
        label: "Ферма покрытия",
        steel: "C345",
        count: "2",
        unitMass_kg: "35.0 кг",
        totalMass_kg: 70,
        note: "12.3 кг/м²",
      },
      { label: "Прогоны (ЛСТК)", steel: "MP350", totalMass_kg: 300 },
      { label: "Подкрановая балка", steel: "C345", totalMass_kg: 60 },
    ]);
  });
});
