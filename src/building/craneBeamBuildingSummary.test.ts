import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDING } from "./buildingContext";
import { buildCraneBeamBuildingSummary } from "./craneBeamBuildingSummary";
import type { ResultItem } from "./resultsContext";

function craneBeam(overrides: Partial<ResultItem> = {}): ResultItem {
  return {
    profile: "30К1",
    steel: "С345",
    count: 24,
    lengthPerPiece_m: 6,
    totalLength_m: 144,
    massPerPiece_kg: 522.00147,
    totalMass_kg: 12_528.03528,
    cost_rub: 1_766_452.97448,
    note: "2 нитки подкранового пути",
    ...overrides,
  };
}

describe("crane beam building summary", () => {
  it("explains that crane beam is not calculated when crane is disabled", () => {
    expect(buildCraneBeamBuildingSummary(DEFAULT_BUILDING, null)).toMatchObject({
      hasCrane: false,
      hasResult: false,
      count: null,
      message: "Кран не включён, подкрановая балка не рассчитывается.",
    });
  });

  it("keeps quantities empty until a crane beam result is published", () => {
    expect(buildCraneBeamBuildingSummary({
      ...DEFAULT_BUILDING,
      hasCrane: true,
    }, null)).toMatchObject({
      hasCrane: true,
      hasResult: false,
      count: null,
      message: "Итог появится после расчёта подкрановой балки.",
    });
  });

  it("shows crane beam count, lengths, mass and details", () => {
    expect(buildCraneBeamBuildingSummary({
      ...DEFAULT_BUILDING,
      hasCrane: true,
    }, craneBeam())).toMatchObject({
      hasCrane: true,
      hasResult: true,
      count: 24,
      lengthPerPiece_m: 6,
      totalLength_m: 144,
      massPerPiece_kg: 522.00147,
      totalMass_kg: 12_528.03528,
      details: "2 нитки подкранового пути",
      message: null,
    });
  });
});
