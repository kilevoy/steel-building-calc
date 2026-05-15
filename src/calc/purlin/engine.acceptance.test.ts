import { describe, expect, it } from "vitest";
import { runPurlinCalculation } from "./engine";
import type { PurlinInput } from "./types";

/**
 * Acceptance test for the purlin engine (ЛСТК side) vs SCN-PURLINS-001.
 *
 * Source: knowledge/wiki/parity/scenarios/SCN-PURLINS-001.md (EXCEL-009).
 *
 * For the LSTK selection branch (МП350 / МП390 × 2ТПС / 2ПС / Z) on this
 * scenario, the current engine matches the workbook exactly:
 *   - Z 350×2.5 selected for both МП350 and МП390 grades,
 *   - spacing 1500 mm,
 *   - mass per building 12 351.6 kg,
 *   - 2ТПС / 2ПС profiles fail (no candidate) — same as Excel.
 *
 * Rolled-section side is covered by the dedicated rolled.acceptance.test.ts.
 *
 * Per knowledge/AGENTS.md: do NOT rewrite the engine to make this test pass.
 * If a regression appears, investigate the engine change first; the fixture
 * is grounded in Excel and is treated as authoritative.
 */
const SCN_PURLINS_001: PurlinInput = {
  gamma_n: 1,
  roofShape: "gable",
  span_m: 24,
  length_m: 60,
  height_m: 12,
  roofSlope_deg: 6,
  framePitch_m: 6,
  terrainType: "B",
  w0_kPa: 0.6,
  Sg_kPa: 2.45,
  roofStructure: "С-П 150 мм",
  roofLoad_kPa: 0.32028,
  snowDrift: "none",
  drift_dropHeight_m: 4.5,
  drift_existingSize_m: 9.5,
  maxStep_mm: 1500,
  minStep_mm: 1500,
  snowGuardPurlin: false,
  fencePurlin: false,
  maxUtilization: "default",
  cassetteHeightFilter_mm: 0,
};

describe("purlin engine — Excel acceptance SCN-PURLINS-001 (ЛСТК)", () => {
  const out = runPurlinCalculation(SCN_PURLINS_001);

  it("computes the design load components", () => {
    // q_snow = 1.4 × 1.1 × 1.13 × Sg × cos(6°) × γn = 4.2401… kPa
    expect(out.q_snow_kPa).toBeCloseTo(4.240134, 4);
    expect(out.q_roof_kPa).toBeCloseTo(0.32028, 5);
    expect(out.q_total_kPa).toBeCloseTo(4.774239, 4);
    expect(out.mu2).toBe(1);
  });

  it("rejects all 2ТПС and 2ПС profiles (no candidate fits)", () => {
    const reject = (grade: "MP350" | "MP390", type: "2TPS" | "2PS") => {
      const sec = out.sections.find((s) => s.grade === grade && s.type === type);
      expect(sec, `${grade}/${type} section missing`).toBeDefined();
      expect(sec!.best, `${grade}/${type} should have no candidate`).toBeNull();
    };
    reject("MP350", "2TPS");
    reject("MP350", "2PS");
    reject("MP390", "2TPS");
    reject("MP390", "2PS");
  });

  it("selects Z 350×2,5 for both grades with the same geometry", () => {
    const Z350 = (grade: "MP350" | "MP390") => {
      const sec = out.sections.find((s) => s.grade === grade && s.type === "Z");
      expect(sec?.best, `${grade}/Z must have a candidate`).not.toBeNull();
      const best = sec!.best!;
      expect(best.profile.name).toBe("Z 350х2,5");
      expect(best.spacing_mm).toBe(1500);
      // Mass per building from Excel SCN-PURLINS-001: 12351.6 kg.
      expect(best.massPerBuilding_kg).toBeCloseTo(12351.6, 4);
      // Utilization stays under the per-thickness default coefficient.
      expect(best.K).toBeLessThanOrEqual(1);
    };
    Z350("MP350");
    Z350("MP390");
  });

  it("fixes current gable-roof purlin line count and slope length model", () => {
    const best = out.top10[0];

    expect(out.L_slope_m).toBeCloseTo((24 - 0.3) / 2, 10);
    expect(best.nPurlins).toBe(18);
    expect(best.massPerFrameStep_kg).toBeCloseTo(1235.16, 4);
    expect(best.massPerBuilding_kg).toBeCloseTo(12351.6, 4);
  });

  it("fixes current monoslope purlin line count model", () => {
    const mono = runPurlinCalculation({
      ...SCN_PURLINS_001,
      roofShape: "monoslope",
    });
    const best = mono.top10[0];

    expect(mono.L_slope_m).toBeCloseTo(24 - 0.3, 10);
    expect(best.nPurlins).toBe(17);
    expect(best.massPerFrameStep_kg).toBeCloseTo(1166.54, 4);
    expect(best.massPerBuilding_kg).toBeCloseTo(11665.4, 4);
  });

  it("returns the lightest candidate first in top10", () => {
    expect(out.top10.length).toBeGreaterThan(0);
    const first = out.top10[0];
    expect(first.profile.name).toBe("Z 350х2,5");
    expect(first.massPerBuilding_kg).toBeCloseTo(12351.6, 4);
    // Each subsequent candidate must be heavier (or equal).
    for (let i = 1; i < out.top10.length; i++) {
      expect(out.top10[i].massPerBuilding_kg).toBeGreaterThanOrEqual(
        out.top10[i - 1].massPerBuilding_kg - 1e-9,
      );
    }
  });
});
