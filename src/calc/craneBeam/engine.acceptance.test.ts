import { describe, expect, it } from "vitest";
import { calculateCraneBeam, craneWorkbook, defaultCraneInputs } from "./engine";

/**
 * Acceptance test for the crane-beam engine vs Excel-recalculated baseline.
 *
 * The expected values are not invented — they live alongside the generated
 * workbook in `workbook.generated.ts` under `defaultScenario.expected` and
 * are produced by recalculating the source Excel via LibreOffice during the
 * generation step. This test pins them, so any unintended drift in the
 * HyperFormula evaluation or in the generated workbook is caught immediately.
 *
 * Per `knowledge/AGENTS.md` and `knowledge/wiki/parity/scenarios/SCN-CRANE-BEAM-001.md`:
 *   - profile name is matched after trimming trailing whitespace (Excel pads cells)
 *   - utilizationPercent and weightKg are matched with 1e-6 absolute tolerance
 *   - the open question about ribStep=B19 vs D19 is documented separately
 */
describe("crane beam engine — Excel acceptance (default scenario)", () => {
  const expected = craneWorkbook.defaultScenario.expected;
  const result = calculateCraneBeam(defaultCraneInputs);

  it("selects the same profile as Excel", () => {
    expect(result.profile).not.toBeNull();
    // Excel pads the cell with a trailing space ("35Ш1 "); trim before compare.
    expect(result.profile?.trim()).toBe(expected.profile.trim());
  });

  it("matches Excel utilization within 1e-6", () => {
    expect(result.utilizationPercent).not.toBeNull();
    expect(result.utilizationPercent!).toBeCloseTo(expected.utilizationPercent, 6);
  });

  it("matches Excel weight within 1e-3 kg", () => {
    expect(result.weightKg).not.toBeNull();
    expect(result.weightKg!).toBeCloseTo(expected.weightKg, 3);
  });

  it("matches Excel deflection check within 1e-6", () => {
    const deflectionCheck = result.deflections[result.deflections.length - 1]?.value;

    expect(deflectionCheck).toBeDefined();
    expect(deflectionCheck!).toBeCloseTo(expected.deflectionCheck, 6);
  });

  it("populates downstream geometry, strength and stability blocks", () => {
    // These blocks come directly from the workbook ranges. Empty arrays
    // would mean the engine wired up the wrong cells — a regression we
    // want to catch even if the headline profile/util numbers match.
    expect(result.dimensions.length).toBe(7);
    expect(result.geometry.length).toBe(15);
    expect(result.strength.length).toBe(8);
    expect(result.crane78.length).toBe(13);
    expect(result.globalStability.length).toBe(5);
    expect(result.localStability.length).toBe(15);
    expect(result.deflections.length).toBe(5);
  });

  it("reports the per-scenario crane catalogue lookups", () => {
    // Sanity: the engine must have read back the Excel-resolved crane
    // metadata for the default scenario (5 t crane, 24 m span).
    expect(result.wheelLoadKn).toBeCloseTo(60, 6);
    expect(result.craneBaseMm).toBeCloseTo(3700, 6);
    expect(result.craneGaugeMm).toBeCloseTo(4700, 6);
  });
});

describe("crane beam engine — Excel acceptance SCN-CRANE-BEAM-002", () => {
  const result = calculateCraneBeam({
    ...defaultCraneInputs,
    capacity: 10,
  });

  it("matches the 10 t crane scenario headline results", () => {
    expect(result.profile).not.toBeNull();
    expect(result.profile?.trim()).toBe("35Ш2");
    expect(result.utilizationPercent).toBeCloseTo(62.58962347, 6);
    expect(result.weightKg).toBeCloseTo(478.20072, 3);
  });

  it("matches the 10 t crane catalogue lookup and deflection check", () => {
    expect(result.wheelLoadKn).toBeCloseTo(95, 6);
    expect(result.craneBaseMm).toBeCloseTo(4400, 6);
    expect(result.craneGaugeMm).toBeCloseTo(5400, 6);
    expect(result.deflections[result.deflections.length - 1]?.value).toBeCloseTo(0.43298646313, 6);
  });

  it("keeps all downstream workbook blocks populated", () => {
    expect(result.dimensions.length).toBe(7);
    expect(result.geometry.length).toBe(15);
    expect(result.strength.length).toBe(8);
    expect(result.crane78.length).toBe(13);
    expect(result.globalStability.length).toBe(5);
    expect(result.localStability.length).toBe(15);
    expect(result.deflections.length).toBe(5);
  });
});

describe("crane beam engine — Excel acceptance SCN-CRANE-BEAM-003", () => {
  const result = calculateCraneBeam({
    ...defaultCraneInputs,
    capacity: 10,
    craneCount: "два",
  });

  it("matches the two-crane 10 t scenario headline results", () => {
    expect(result.profile).not.toBeNull();
    expect(result.profile?.trim()).toBe("30К1");
    expect(result.utilizationPercent).toBeCloseTo(79.580983572, 6);
    expect(result.weightKg).toBeCloseTo(522.00147, 3);
  });

  it("matches the two-crane catalogue lookup and deflection check", () => {
    expect(result.wheelLoadKn).toBeCloseTo(95, 6);
    expect(result.craneBaseMm).toBeCloseTo(4400, 6);
    expect(result.craneGaugeMm).toBeCloseTo(5400, 6);
    expect(result.ribStepSelectedM).toBeCloseTo(6, 6);
    expect(result.deflections[result.deflections.length - 1]?.value).toBeCloseTo(0.49794686031, 6);
  });
});

describe("crane beam engine — кэш книги не зависит от предыдущих расчётов", () => {
  it("повторный расчёт сценария после другого сценария даёт тот же результат", () => {
    const first = calculateCraneBeam(defaultCraneInputs);
    calculateCraneBeam({ ...defaultCraneInputs, capacity: 10, craneCount: "два" });
    const again = calculateCraneBeam(defaultCraneInputs);

    expect(again.profile).toBe(first.profile);
    expect(again.utilizationPercent).toBe(first.utilizationPercent);
    expect(again.weightKg).toBe(first.weightKg);
    expect(again.deflections).toEqual(first.deflections);
    expect(again.localStability).toEqual(first.localStability);
  });
});
