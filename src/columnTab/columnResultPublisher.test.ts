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
    expect(payload.edge?.details).toBe("распорок на колонну: 2; всего распорок: 8");
    expect(payload.edge?.lengthPerPiece_m).toBeCloseTo(10, 10);
    expect(payload.edge?.totalLength_m).toBeCloseTo(40, 10);
    expect(payload.edge?.breakdown).toHaveLength(1);
    expect(payload.edge?.breakdown?.[0].details).toBe("распорок на колонну: 2; всего распорок: 8");
    expect(payload.edge?.breakdown?.[0]).toMatchObject({
      count: 4,
      lengthPerPiece_m: 10,
      totalLength_m: 40,
    });
    expect(payload.edge?.totalMass_kg).toBeCloseTo(40 * 40 + 2 * 9.6 * 6 * 1.15 * 4, 10);
    expect(payload.edge?.cost_rub).toBeCloseTo(
      40 * 40 * 100 + 2 * 9.6 * 6 * 1.15 * 4 * input.prices["С255Б"],
      10,
    );

    expect(payload.fachwerk?.count).toBe(10);
    expect(payload.fachwerk?.details).toBe("распорок на колонну: 1; всего распорок: 10");
    expect(payload.fachwerk?.lengthPerPiece_m).toBeCloseTo(10, 10);
    expect(payload.fachwerk?.totalLength_m).toBeCloseTo(100, 10);
    expect(payload.fachwerk?.breakdown).toHaveLength(1);
    expect(payload.fachwerk?.breakdown?.[0]).toMatchObject({
      count: 10,
      lengthPerPiece_m: 10,
      totalLength_m: 100,
    });
    expect(payload.fachwerk?.totalMass_kg).toBeCloseTo(
      20 * 100 + 1 * 9.6 * 6 * 1.15 * 10,
      10,
    );
  });

  it("groups fachwerk columns by roof-dependent lengths", () => {
    const input: CalculationInput = {
      ...DEFAULT_COLUMN_INPUT,
      span_m: 24,
      length_m: 72,
      height_m: 12,
      framePitch_m: 6,
      fachverkPitch_m: 6,
      roofSlope_deg: 5,
      roofType: "gable",
      spanCount: "single",
      prices: {
        ...DEFAULT_COLUMN_INPUT.prices,
        С345: 100,
      },
    };
    const results: Record<ColumnType, CalculationOutput> = {
      edge: resultFor("edge-test", 40, 0),
      fachwerk: resultFor("fachwerk-test", 20, 0),
      middle: resultFor("middle-test", 30, 0),
    };

    const payload = buildColumnResultPayload(input, results);

    expect(payload.fachwerk?.count).toBe(10);
    expect(payload.fachwerk?.breakdown).toHaveLength(3);
    expect(payload.fachwerk?.breakdown?.map((item) => item.count)).toEqual([4, 4, 2]);
    expect(payload.fachwerk?.breakdown?.[0].lengthPerPiece_m).toBeCloseTo(12, 10);
    expect(payload.fachwerk?.breakdown?.[2].lengthPerPiece_m).toBeGreaterThan(13);
    const breakdownLength = payload.fachwerk!.breakdown!.reduce(
      (sum, item) => sum + (item.totalLength_m ?? 0),
      0,
    );
    const breakdownMass = payload.fachwerk!.breakdown!.reduce(
      (sum, item) => sum + item.totalMass_kg,
      0,
    );
    expect(breakdownLength).toBeCloseTo(payload.fachwerk!.totalLength_m!, 10);
    expect(breakdownMass).toBeCloseTo(payload.fachwerk!.totalMass_kg, 10);
  });

  it("groups edge columns by length for monoslope roofs", () => {
    const input: CalculationInput = {
      ...DEFAULT_COLUMN_INPUT,
      span_m: 24,
      length_m: 72,
      height_m: 12,
      framePitch_m: 6,
      fachverkPitch_m: 6,
      roofSlope_deg: 5,
      roofType: "single_slope",
      spanCount: "single",
      prices: {
        ...DEFAULT_COLUMN_INPUT.prices,
        С345: 100,
      },
    };
    const results: Record<ColumnType, CalculationOutput> = {
      edge: resultFor("edge-test", 40, 0),
      fachwerk: resultFor("fachwerk-test", 20, 0),
      middle: resultFor("middle-test", 30, 0),
    };

    const payload = buildColumnResultPayload(input, results);

    expect(payload.edge?.count).toBe(22);
    expect(payload.edge?.breakdown).toHaveLength(2);
    expect(payload.edge?.breakdown?.map((item) => item.count)).toEqual([11, 11]);
    expect(payload.edge?.breakdown?.[0].lengthPerPiece_m).toBeCloseTo(12, 10);
    expect(payload.edge?.breakdown?.[1].lengthPerPiece_m).toBeGreaterThan(14);
    const breakdownMass = payload.edge!.breakdown!.reduce(
      (sum, item) => sum + item.totalMass_kg,
      0,
    );
    expect(breakdownMass).toBeCloseTo(payload.edge!.totalMass_kg, 10);
  });
});
