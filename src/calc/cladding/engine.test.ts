import { describe, expect, it } from "vitest";
import { calculateCladding, validateCladdingInput, type CladdingInput } from "./engine";

const GABLE_INPUT: CladdingInput = {
  span_m: 24,
  length_m: 38,
  eavesHeight_m: 5,
  roofSlope_deg: 8,
  roofShape: "gable",
  eavesOverhang_m: 0,
  gableOverhang_m: 0,
  wallOpenings_m2: 0,
  roofOpenings_m2: 0,
  reserve_percent: 0,
};

describe("calculateCladding", () => {
  it("calculates a gable building surface area", () => {
    const result = calculateCladding(GABLE_INPUT);

    expect(result.roofGross_m2).toBeCloseTo(920.96, 2);
    expect(result.longitudinalWallsGross_m2).toBeCloseTo(380, 6);
    expect(result.endWallRectanglesGross_m2).toBeCloseTo(240, 6);
    expect(result.upperEndWallsGross_m2).toBeCloseTo(40.48, 2);
    expect(result.totalGross_m2).toBeCloseTo(1581.44, 2);
  });

  it("deducts openings and applies reserve only to net areas", () => {
    const result = calculateCladding({
      ...GABLE_INPUT,
      wallOpenings_m2: 60,
      roofOpenings_m2: 10,
      reserve_percent: 10,
    });

    expect(result.roofNet_m2).toBeCloseTo(result.roofGross_m2 - 10, 8);
    expect(result.wallsNet_m2).toBeCloseTo(result.wallsGross_m2 - 60, 8);
    expect(result.totalOrder_m2).toBeCloseTo(result.totalNet_m2 * 1.1, 8);
  });

  it("includes the high longitudinal wall for a monoslope roof", () => {
    const result = calculateCladding({
      ...GABLE_INPUT,
      roofShape: "monoslope",
    });
    const rise = 24 * Math.tan((8 * Math.PI) / 180);

    expect(result.roofRise_m).toBeCloseTo(rise, 8);
    expect(result.longitudinalWallsGross_m2).toBeCloseTo(2 * 38 * 5 + 38 * rise, 8);
    expect(result.upperEndWallsGross_m2).toBeCloseTo(24 * rise, 8);
  });

  it("rejects invalid geometry and openings larger than the surface", () => {
    expect(validateCladdingInput({ ...GABLE_INPUT, span_m: 0 })).toContain(
      "Ширина здания: значение должно быть больше 0.",
    );
    expect(() => calculateCladding({ ...GABLE_INPUT, wallOpenings_m2: 1000 })).toThrow(
      "Площадь проёмов в стенах превышает площадь стен.",
    );
  });
});
