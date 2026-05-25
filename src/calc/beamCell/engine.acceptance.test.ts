import { describe, expect, it } from "vitest";
import { workbookData } from "./catalog.generated";
import { calculate, defaultInputs } from "./engine";

describe("beam cell Excel acceptance scenarios", () => {
  it("matches the main beam observations for SCN-BEAM-CELL-001", () => {
    const expected = workbookData.savedScenario.expected;
    const result = calculate(defaultInputs);

    expect(result.qSecondary).toBeUndefined();
    expect(result.secondary.C245.status).toBe(expected.secondaryBeamStatus);
    expect(result.secondary.C345.status).toBe(expected.secondaryBeamStatus);
    expect(result.columns.C245.status).toBe(expected.columnStatus);
    expect(result.columns.C345.status).toBe(expected.columnStatus);

    expect(result.main.C245).toMatchObject({
      status: "OK",
      material: "C245",
      profile: expected.mainBeam.C245.profile,
    });
    expect(result.main.C245.weightKg).toBeCloseTo(expected.mainBeam.C245.weightKg, 6);
    expect(result.main.C245.costRub).toBeCloseTo(expected.mainBeam.C245.costRub, 4);

    expect(result.main.C345).toMatchObject({
      status: "OK",
      material: "C345",
      profile: expected.mainBeam.C345.profile,
    });
    expect(result.main.C345.weightKg).toBeCloseTo(expected.mainBeam.C345.weightKg, 6);
    expect(result.main.C345.costRub).toBeCloseTo(expected.mainBeam.C345.costRub, 4);

    expect(result.accepted.main).toMatchObject({
      status: "OK",
      material: "C345",
      profile: expected.mainBeam.C345.profile,
    });
    expect(result.accepted.columns.status).toBe(expected.columnStatus);
  });
});
