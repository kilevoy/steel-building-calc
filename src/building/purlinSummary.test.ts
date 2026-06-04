import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDING } from "./buildingContext";
import { buildPurlinBuildingSummary } from "./purlinSummary";
import type { ResultItem } from "./resultsContext";

function purlinItem(overrides: Partial<ResultItem> = {}): ResultItem {
  return {
    profile: "Z 145x1.5",
    steel: "МП350",
    count: 216,
    lengthPerPiece_m: 6,
    totalLength_m: 1296,
    note: "Разрезной, шаг 1485 мм",
    totalMass_kg: 1000,
    cost_rub: 100_000,
    ...overrides,
  };
}

describe("purlin building summary", () => {
  it("keeps quantities empty before a purlin result is available", () => {
    expect(buildPurlinBuildingSummary(DEFAULT_BUILDING, null)).toMatchObject({
      hasResult: false,
      selectedType: "Авто",
      scheme: "Разрезной",
      details: null,
      count: null,
      lengthPerPiece_m: null,
      totalLength_m: null,
    });
  });

  it("shows split purlin count, length and spacing", () => {
    expect(buildPurlinBuildingSummary(DEFAULT_BUILDING, purlinItem())).toMatchObject({
      hasResult: true,
      selectedType: "Авто",
      scheme: "Разрезной",
      details: "шаг 1485 мм",
      count: 216,
      lengthPerPiece_m: 6,
      totalLength_m: 1296,
    });
  });

  it("shows the selected continuous scheme from the building state", () => {
    expect(buildPurlinBuildingSummary({
      ...DEFAULT_BUILDING,
      purlinContinuityScheme: "continuous",
      purlinSelectionMode: "rolled",
    }, purlinItem({
      count: 18,
      lengthPerPiece_m: 72,
      totalLength_m: 1296,
      note: "Неразрезной, шаг 1500 мм",
    }))).toMatchObject({
      selectedType: "Прокатный черный металл",
      scheme: "Неразрезной",
      details: "шаг 1500 мм",
      count: 18,
      lengthPerPiece_m: 72,
    });
  });
});
