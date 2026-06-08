import { describe, expect, it } from "vitest";
import { buildBeamCellBuildingSummary } from "./beamCellBuildingSummary";
import type { ResultItem } from "./resultsContext";

function beamCell(overrides: Partial<ResultItem> = {}): ResultItem {
  return {
    profile: "40 Б2",
    steel: "С245",
    count: 4,
    lengthPerPiece_m: 12.05,
    totalLength_m: 48.2,
    massPerPiece_kg: 792,
    totalMass_kg: 3168,
    cost_rub: 612_000,
    note: "торцы, 2 ската",
    ...overrides,
  };
}

describe("beam cell building summary", () => {
  it("keeps quantities empty before a beam cell result is available", () => {
    expect(buildBeamCellBuildingSummary(null)).toEqual({
      hasResult: false,
      count: null,
      lengthPerPiece_m: null,
      totalLength_m: null,
      massPerPiece_kg: null,
      totalMass_kg: null,
      details: null,
    });
  });

  it("shows beam count, lengths, mass and details", () => {
    expect(buildBeamCellBuildingSummary(beamCell())).toMatchObject({
      hasResult: true,
      count: 4,
      lengthPerPiece_m: 12.05,
      totalLength_m: 48.2,
      massPerPiece_kg: 792,
      totalMass_kg: 3168,
      details: "торцы, 2 ската",
    });
  });

  it("prefers explicit details over legacy notes", () => {
    expect(buildBeamCellBuildingSummary(beamCell({
      details: "ручная деталь",
      note: "старое примечание",
    })).details).toBe("ручная деталь");
  });
});
