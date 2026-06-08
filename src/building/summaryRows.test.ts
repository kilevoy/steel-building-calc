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
        lengthPerPiece_m: "—",
        totalLength_m: "—",
        unitMass_kg: "35.0 кг",
        totalMass_kg: 70,
        details: "внутренние рамы, 12.3 кг/м²",
      },
      { label: "Прогоны (ЛСТК)", steel: "MP350", totalMass_kg: 300 },
      { label: "Подкрановая балка", steel: "C345", totalMass_kg: 60 },
    ]);
  });

  it("shows piece length and total length when a module publishes them", () => {
    const results: BuildingResults = {
      ...emptyResults,
      purlin: {
        profile: "Z 140х1,5",
        steel: "МП350",
        count: 156,
        lengthPerPiece_m: 6,
        totalLength_m: 936,
        note: "Разрезной, шаг 1500 мм",
        totalMass_kg: 300,
        cost_rub: 3_000,
      },
    };

    expect(buildSummaryRows(results)[0]).toMatchObject({
      count: "156",
      lengthPerPiece_m: "6.00 м",
      totalLength_m: "936.00 м",
      details: "Разрезной, шаг 1500 мм",
    });
  });

  it("passes accounting details into a dedicated summary field", () => {
    const results: BuildingResults = {
      ...emptyResults,
      column: {
        edge: {
          profile: "35 Б1",
          steel: "С355Б",
          count: 4,
          massPerPiece_kg: 100,
          totalMass_kg: 400,
          cost_rub: 40_000,
          details: "распорок на колонну: 2; всего распорок: 8",
        },
        middle: null,
        fachwerk: null,
      },
    };

    expect(buildSummaryRows(results)[0]).toMatchObject({
      label: "Колонна крайняя",
      details: "распорок на колонну: 2; всего распорок: 8",
    });
  });

  it("shows explicit single-piece counts instead of hiding them", () => {
    const results: BuildingResults = {
      ...emptyResults,
      craneBeam: {
        profile: "30К1",
        steel: "С345",
        count: 1,
        massPerPiece_kg: 522.00147,
        totalMass_kg: 522.00147,
        cost_rub: 0,
      },
    };

    expect(buildSummaryRows(results)[0]).toMatchObject({
      label: "Подкрановая балка",
      count: "1",
      unitMass_kg: "522.0 кг",
    });
  });

  it("shows truss length fields when published by the truss module", () => {
    const results: BuildingResults = {
      ...emptyResults,
      truss: {
        sections: [{ section: "ВП", profile: "100х100х4", steel: "С345", totalMass_kg: 300 }],
        totalMass_kg: 900,
        totalCost_rub: 135_000,
        unitMass_kg_per_m2: 10,
        n_trusses: 3,
        lengthPerPiece_m: 24,
        totalLength_m: 72,
      },
    };

    expect(buildSummaryRows(results)[0]).toMatchObject({
      label: "Ферма покрытия",
      count: "3",
      lengthPerPiece_m: "24.00 м",
      totalLength_m: "72.00 м",
    });
  });

  it("expands fachwerk column breakdown by length in the summary table", () => {
    const results: BuildingResults = {
      ...emptyResults,
      column: {
        edge: null,
        middle: null,
        fachwerk: {
          profile: "35 Б1",
          steel: "С355Б",
          count: 10,
          lengthPerPiece_m: 12.5,
          totalLength_m: 125,
          totalMass_kg: 1_000,
          cost_rub: 100_000,
          breakdown: [
            {
              profile: "35 Б1",
              steel: "С355Б",
              count: 4,
              lengthPerPiece_m: 12,
              totalLength_m: 48,
              totalMass_kg: 400,
              cost_rub: 40_000,
            },
            {
              profile: "35 Б1",
              steel: "С355Б",
              count: 6,
              lengthPerPiece_m: 12.83,
              totalLength_m: 76.98,
              totalMass_kg: 600,
              cost_rub: 60_000,
            },
          ],
        },
      },
    };

    expect(buildSummaryRows(results)).toMatchObject([
      {
        label: "Колонна фахверк",
        count: "4",
        lengthPerPiece_m: "12.00 м",
        totalLength_m: "48.00 м",
      },
      {
        label: "Колонна фахверк",
        count: "6",
        lengthPerPiece_m: "12.83 м",
        totalLength_m: "76.98 м",
      },
    ]);
  });
});
