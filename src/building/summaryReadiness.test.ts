import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDING } from "./buildingContext";
import type { BuildingResults, ResultItem } from "./resultsContext";
import {
  buildSummaryReadiness,
  hasMissingRequiredSummaryItems,
} from "./summaryReadiness";

const emptyResults: BuildingResults = {
  column: null,
  truss: null,
  purlin: null,
  beamCell: null,
  windowRiegel: null,
  craneBeam: null,
};

function item(): ResultItem {
  return {
    profile: "test",
    steel: "С345",
    totalMass_kg: 100,
    cost_rub: 10_000,
  };
}

describe("summary readiness", () => {
  it("marks missing required modules and skips crane beam when crane is disabled", () => {
    const items = buildSummaryReadiness(DEFAULT_BUILDING, emptyResults);

    expect(items).toMatchObject([
      { label: "Колонны", status: "missing" },
      { label: "Фермы", status: "missing" },
      { label: "Прогоны", status: "missing" },
      { label: "Балка покрытия", status: "missing" },
      { label: "Оконные ригели", status: "missing" },
      { label: "Подкрановая балка", status: "not-required" },
    ]);
    expect(hasMissingRequiredSummaryItems(items)).toBe(true);
  });

  it("marks all required modules ready when results are published", () => {
    const results: BuildingResults = {
      column: { edge: item(), middle: null, fachwerk: item() },
      truss: {
        sections: [],
        totalMass_kg: 100,
        totalCost_rub: 10_000,
        unitMass_kg_per_m2: 1,
        n_trusses: 1,
      },
      purlin: item(),
      beamCell: item(),
      windowRiegel: item(),
      craneBeam: null,
    };

    const items = buildSummaryReadiness(DEFAULT_BUILDING, results);

    expect(items.map((entry) => entry.status)).toEqual([
      "ready",
      "ready",
      "ready",
      "ready",
      "ready",
      "not-required",
    ]);
    expect(hasMissingRequiredSummaryItems(items)).toBe(false);
  });

  it("requires crane beam when crane is enabled", () => {
    const items = buildSummaryReadiness({
      ...DEFAULT_BUILDING,
      hasCrane: true,
    }, emptyResults);

    expect(items[items.length - 1]).toMatchObject({
      label: "Подкрановая балка",
      status: "missing",
      message: "кран включён, нужен расчёт подкрановой балки",
    });
  });
});
