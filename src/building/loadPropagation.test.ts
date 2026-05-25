import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDING } from "./buildingContext";
import { EMPTY_RESULTS } from "./resultsContext";
import { calculateRoofTotalLoad_kPa } from "./loadPropagation";

describe("roof load propagation", () => {
  it("uses roof structure load when no calculated roof elements are published", () => {
    const load = calculateRoofTotalLoad_kPa(
      {
        ...DEFAULT_BUILDING,
        roofStructure: "профлист",
        span_m: 24,
        length_m: 72,
        roofSlope_deg: 0,
      },
      EMPTY_RESULTS,
    );

    expect(load.structure_kPa).toBeCloseTo(0.105, 10);
    expect(load.purlin_kPa).toBe(0);
    expect(load.beamCell_kPa).toBe(0);
    expect(load.total_kPa).toBeCloseTo(0.105, 10);
  });

  it("adds purlin self-weight over sloped roof area", () => {
    const load = calculateRoofTotalLoad_kPa(
      {
        ...DEFAULT_BUILDING,
        roofStructure: "профлист",
        span_m: 24,
        length_m: 72,
        roofSlope_deg: 5,
      },
      {
        ...EMPTY_RESULTS,
        purlin: {
          profile: "Z 350x2",
          steel: "MP350",
          totalMass_kg: 12_126.4,
          cost_rub: 0,
        },
      },
    );

    const roofArea = 24 * 72 * (1 / Math.cos((5 * Math.PI) / 180));
    const expectedPurlin = (12_126.4 / roofArea) * 0.00981;

    expect(load.structure_kPa).toBeCloseTo(0.105, 10);
    expect(load.purlin_kPa).toBeCloseTo(expectedPurlin, 10);
    expect(load.beamCell_kPa).toBe(0);
    expect(load.total_kPa).toBeCloseTo(0.105 + expectedPurlin, 10);
  });

  it("adds beam-cell self-weight independently from purlins", () => {
    const load = calculateRoofTotalLoad_kPa(
      {
        ...DEFAULT_BUILDING,
        roofStructure: "С-П 150 мм",
        span_m: 18,
        length_m: 30,
        roofSlope_deg: 0,
      },
      {
        ...EMPTY_RESULTS,
        beamCell: {
          profile: "40 B2",
          steel: "C245",
          totalMass_kg: 1_458.9,
          cost_rub: 0,
        },
      },
    );

    const expectedBeamCell = (1_458.9 / (18 * 30)) * 0.00981;

    expect(load.purlin_kPa).toBe(0);
    expect(load.beamCell_kPa).toBeCloseTo(expectedBeamCell, 10);
    expect(load.total_kPa).toBeCloseTo(load.structure_kPa + expectedBeamCell, 10);
  });
});
