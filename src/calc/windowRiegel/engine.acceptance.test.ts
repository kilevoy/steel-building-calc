import { describe, expect, it } from "vitest";
import { calculateWindowRiegel, windowRiegelWorkbook } from "./engine";
import type { WindowRiegelInputs } from "./types";

const SCN_WINDOW_RIEGEL_001: WindowRiegelInputs = {
  city: "Новый Уренгой",
  responsibilityLevel: 1,
  windowHeightM: 1,
  frameStepM: 6,
  windowType: 1,
  buildingHeightM: 6,
  buildingSpanM: 18,
  buildingLengthM: 42,
  terrainType: "А",
  windLoadKpa: 0.38,
  windStandard: "по СП 20.13330.20ХХ",
  windowConstruction: "2ой стеклопакет",
  maxUtilization: 0.85,
};

describe("window riegel Excel acceptance scenarios", () => {
  it("matches the first observed options for SCN-WINDOW-RIEGEL-001", () => {
    const expected = windowRiegelWorkbook.defaultScenario.expected;
    const result = calculateWindowRiegel(SCN_WINDOW_RIEGEL_001);

    expect(result.verticalLoadKpa).toBeCloseTo(0.42, 12);
    expect(result.horizontalLoadKpa).toBeCloseTo(0.8761163808768, 10);
    expect(result.outOfPlaneLengthM).toBe(6);
    expect(result.inPlaneLengthM).toBe(6);
    expect(result.warnings).toEqual([]);
    expect(result.lowerAndUpperProfiles).toHaveLength(10);
    expect(result.upperType1Profiles).toHaveLength(10);

    expect(result.lowerAndUpperProfiles[0]).toMatchObject({
      profile: expected.lowerFirstProfile,
      steel: expected.lowerFirstSteel,
    });
    expect(result.lowerAndUpperProfiles[0].weightKg).toBeCloseTo(expected.lowerFirstWeightKg, 6);

    expect(result.upperType1Profiles[0]).toMatchObject({
      profile: expected.upperFirstProfile,
      steel: expected.upperFirstSteel,
    });
    expect(result.upperType1Profiles[0].weightKg).toBeCloseTo(expected.upperFirstWeightKg, 6);
  });
});
