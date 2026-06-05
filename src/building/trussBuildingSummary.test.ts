import { describe, expect, it } from "vitest";
import type { TrussResult } from "./resultsContext";
import { buildTrussBuildingSummary } from "./trussBuildingSummary";

function truss(overrides: Partial<TrussResult> = {}): TrussResult {
  return {
    sections: [
      { section: "ВП", profile: "тр.200×160×6", steel: "С345", totalMass_kg: 4000 },
      { section: "НП", profile: "тр.120×5", steel: "С345", totalMass_kg: 3000 },
    ],
    totalMass_kg: 7000,
    totalCost_rub: 987000,
    unitMass_kg_per_m2: 18.54,
    n_trusses: 11,
    lengthPerPiece_m: 24,
    totalLength_m: 264,
    ...overrides,
  };
}

describe("truss building summary", () => {
  it("keeps quantities empty before a truss result is available", () => {
    expect(buildTrussBuildingSummary(null)).toEqual({
      hasResult: false,
      count: null,
      lengthPerPiece_m: null,
      totalLength_m: null,
      massPerPiece_kg: null,
      totalMass_kg: null,
      unitMass_kg_per_m2: null,
      details: null,
    });
  });

  it("shows truss quantity, lengths and mass", () => {
    expect(buildTrussBuildingSummary(truss())).toMatchObject({
      hasResult: true,
      count: 11,
      lengthPerPiece_m: 24,
      totalLength_m: 264,
      massPerPiece_kg: 7000 / 11,
      totalMass_kg: 7000,
      unitMass_kg_per_m2: 18.54,
      details: "внутренние рамы",
    });
  });

  it("does not divide by zero when a malformed truss count is published", () => {
    expect(buildTrussBuildingSummary(truss({ n_trusses: 0 })).massPerPiece_kg).toBeNull();
  });
});
