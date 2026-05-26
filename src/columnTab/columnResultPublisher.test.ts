import { describe, expect, it } from "vitest";
import type { CalculationInput, CalculationOutput, ColumnType, ProfileResult } from "../calc/types";
import { DEFAULT_COLUMN_INPUT } from "../defaults/columnInput";
import { buildColumnResultPayload } from "./columnResultPublisher";

function resultFor(profileName: string, mass_per_m: number, strutCount: number): CalculationOutput {
  const profileResult: ProfileResult = {
    rank: 1,
    profileName,
    steel: "С345",
    struts: strutCount,
    Ry_MPa: 345,
    utilizationSigma: 0,
    utilizationStabX: 0,
    utilizationStabY: 0,
    utilizationSlendX: 0,
    utilizationSlendY: 0,
    maxUtilization: 0,
    limitingCheck: "test",
    mass_per_m,
    columnMass_kg: 0,
    strutCount,
    totalMass_kg: 0,
    cost_rub: 0,
  };

  return {
    N_kN: 0,
    M_kNm: 0,
    Q_kN: 0,
    mu: 1,
    snowLoad_kPa: 0,
    windPressure_kPa: 0,
    windSuction_kPa: 0,
    tributaryArea_m2: 0,
    wallArea_m2: 0,
    results: [profileResult],
  };
}

describe("column result publisher", () => {
  it("uses the same strut unit mass as the column engine when publishing summary mass", () => {
    const input: CalculationInput = {
      ...DEFAULT_COLUMN_INPUT,
      span_m: 24,
      length_m: 18,
      height_m: 10,
      framePitch_m: 6,
      fachverkPitch_m: 6,
      roofSlope_deg: 0,
      roofType: "gable",
      spanCount: "single",
      prices: {
        ...DEFAULT_COLUMN_INPUT.prices,
        С345: 100,
      },
    };
    const results: Record<ColumnType, CalculationOutput> = {
      edge: resultFor("edge-test", 40, 2),
      fachwerk: resultFor("fachwerk-test", 20, 1),
      middle: resultFor("middle-test", 30, 3),
    };

    const payload = buildColumnResultPayload(input, results);

    expect(payload.edge?.count).toBe(4);
    expect(payload.edge?.lengthPerPiece_m).toBeCloseTo(10, 10);
    expect(payload.edge?.totalLength_m).toBeCloseTo(40, 10);
    expect(payload.edge?.totalMass_kg).toBeCloseTo(40 * 40 + 2 * 9.6 * 6 * 1.15 * 4, 10);
    expect(payload.edge?.cost_rub).toBeCloseTo(payload.edge!.totalMass_kg * 100, 10);

    expect(payload.fachwerk?.count).toBe(10);
    expect(payload.fachwerk?.lengthPerPiece_m).toBeCloseTo(10, 10);
    expect(payload.fachwerk?.totalLength_m).toBeCloseTo(100, 10);
    expect(payload.fachwerk?.totalMass_kg).toBeCloseTo(
      20 * 100 + 1 * 9.6 * 6 * 1.15 * 10,
      10,
    );
  });
});
