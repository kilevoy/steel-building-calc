import { describe, expect, it } from "vitest";
import { calculate, defaultInputs } from "./engine";

describe("beam cell Excel acceptance scenarios", () => {
  it("matches the main beam observations for SCN-BEAM-CELL-001", () => {
    const result = calculate(defaultInputs);

    expect(result.qSecondary).toBeUndefined();
    expect(result.secondary.C245.status).toBe("NO_SOLUTION");
    expect(result.secondary.C345.status).toBe("NO_SOLUTION");

    expect(result.main.C245).toMatchObject({
      status: "OK",
      material: "C245",
      profile: "25 Б2",
    });
    expect(result.main.C245.weightKg).toBeCloseTo(355.2012, 6);
    expect(result.main.C245.costRub).toBeCloseTo(68624.6412, 4);

    expect(result.main.C345).toMatchObject({
      status: "OK",
      material: "C345",
      profile: "25 Б1",
    });
    expect(result.main.C345.weightKg).toBeCloseTo(308.4098, 6);
    expect(result.main.C345.costRub).toBeCloseTo(62774.8298, 4);

    expect(result.accepted.main).toMatchObject({
      status: "OK",
      material: "C345",
      profile: "25 Б1",
    });
  });
});
