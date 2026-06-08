import { describe, expect, it } from "vitest";
import { buildWindowRiegelBuildingSummary } from "./windowRiegelBuildingSummary";
import type { ResultItem } from "./resultsContext";

function windowRiegel(overrides: Partial<ResultItem> = {}): ResultItem {
  return {
    profile: "кв.120х4",
    steel: "С245",
    count: 12,
    massPerPiece_kg: 87.0017,
    totalMass_kg: 1_044.0204,
    cost_rub: 135_991.45608,
    note: "количество задано расчётчиком",
    ...overrides,
  };
}

describe("window riegel building summary", () => {
  it("keeps quantities empty until a window riegel result is published", () => {
    expect(buildWindowRiegelBuildingSummary(null)).toEqual({
      hasResult: false,
      count: null,
      massPerPiece_kg: null,
      totalMass_kg: null,
      details: null,
      message: "Итог по оконным ригелям появится после расчёта вкладки «Оконные ригели».",
    });
  });

  it("shows manually assigned count, mass and details", () => {
    expect(buildWindowRiegelBuildingSummary(windowRiegel())).toEqual({
      hasResult: true,
      count: 12,
      massPerPiece_kg: 87.0017,
      totalMass_kg: 1_044.0204,
      details: "количество задано расчётчиком",
      message: "Количество оконных ригелей задаётся расчётчиком по фасадам.",
    });
  });
});
