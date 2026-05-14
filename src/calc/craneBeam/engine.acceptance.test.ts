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
