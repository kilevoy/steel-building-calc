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

  it("matches the complete monolithic slab solution for SCN-BEAM-CELL-002", () => {
    const result = calculate({
      ...defaultInputs,
      floorType: "монолитный ЖБ 150мм",
      floorLoadKgM2: 145,
      acceptedSecondarySteel: "C345",
      acceptedMainSteel: "C345",
      acceptedColumnSteel: "C345",
    });

    expect(result.qSecondary).toBeCloseTo(6.885, 6);
    expect(result.qMain).toBeCloseTo(6.885, 6);

    expect(result.secondary.C245).toMatchObject({
      status: "OK",
      material: "C245",
      profile: "18 Б1",
      stepMm: 750,
    });
    expect(result.secondary.C245.weightKg).toBeCloseTo(831.6008075, 6);
    expect(result.secondary.C245.costRub).toBeCloseTo(160665.1208075, 6);

    expect(result.secondary.C345).toMatchObject({
      status: "OK",
      material: "C345",
      profile: "18 Б1",
      stepMm: 1000,
    });
    expect(result.secondary.C345.weightKg).toBeCloseTo(646.80951, 1);
    expect(result.secondary.C345.costRub).toBeCloseTo(131656.14951, 1);

    expect(result.main.C245).toMatchObject({
      status: "OK",
      material: "C245",
      profile: "40 Б2",
    });
    expect(result.main.C245.weightKg).toBeCloseTo(792.0018, 6);
    expect(result.main.C245.costRub).toBeCloseTo(153014.4018, 6);

    expect(result.main.C345).toMatchObject({
      status: "OK",
      material: "C345",
      profile: "35 Б2",
    });
    expect(result.main.C345.weightKg).toBeCloseTo(595.2103, 6);
    expect(result.main.C345.costRub).toBeCloseTo(121152.9703, 6);

    expect(result.columns.C245).toMatchObject({
      status: "OK",
      material: "C245",
      profile: "кв.180х5",
    });
    expect(result.columns.C245.weightKg).toBeCloseTo(244.8, 6);
    expect(result.columns.C245.costRub).toBeCloseTo(41101.9306, 6);

    expect(result.columns.C345).toMatchObject({
      status: "OK",
      material: "C345",
      profile: "кв.160х5",
    });
    expect(result.columns.C345.weightKg).toBeCloseTo(216.9, 6);
    expect(result.columns.C345.costRub).toBeCloseTo(38911.891, 6);

    expect(result.accepted.secondary.profile).toBe("18 Б1");
    expect(result.accepted.main.profile).toBe("35 Б2");
    expect(result.accepted.columns.profile).toBe("кв.160х5");
    expect(result.totals.withoutColumnsKg).toBeCloseTo(1242.01981, 1);
    expect(result.totals.withColumnsKg).toBeCloseTo(1458.91981, 1);
  });
});
