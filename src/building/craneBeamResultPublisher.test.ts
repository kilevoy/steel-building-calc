import { describe, expect, it } from "vitest";
import type { CraneCalculationResult } from "../calc/craneBeam/types";
import { buildCraneBeamResultItem } from "./craneBeamResultPublisher";

function result(patch: Partial<CraneCalculationResult> = {}): CraneCalculationResult {
  return {
    profile: "30К1",
    utilizationPercent: 79.58,
    weightKg: 522.00147,
    wheelLoadKn: 95,
    trolleyMassT: null,
    craneBaseMm: 4400,
    craneGaugeMm: 5400,
    railFootWidthM: null,
    railHeightM: null,
    ribStepSelectedM: 6,
    dimensions: [],
    geometry: [],
    strength: [],
    crane78: [],
    globalStability: [],
    localStability: [],
    deflections: [],
    warnings: [],
    ...patch,
  };
}

describe("crane beam result publisher", () => {
  it("returns null when crane beam result is absent or incomplete", () => {
    expect(buildCraneBeamResultItem(null)).toBeNull();
    expect(buildCraneBeamResultItem(result({ profile: null }))).toBeNull();
    expect(buildCraneBeamResultItem(result({ weightKg: null }))).toBeNull();
  });

  it("publishes one crane beam as a per-piece summary item", () => {
    expect(buildCraneBeamResultItem(result())).toEqual({
      profile: "30К1",
      steel: "С345",
      massPerPiece_kg: 522.00147,
      count: 1,
      totalMass_kg: 522.00147,
      cost_rub: 0,
    });
  });
});
