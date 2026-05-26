import { describe, expect, it } from "vitest";
import { isLayeredAssemblyRoof, runPurlinCalculation } from "./engine";
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
  deckProfile: "С44-1000-0,7",
  roofLoad_kPa: 0.32028,
  snowDrift: "none",
  drift_dropHeight_m: 4.5,
  drift_existingSize_m: 9.5,
  maxStep_mm: 1500,
  minStep_mm: 1500,
  snowGuardPurlin: false,
  fencePurlin: false,
  tieInstallation: "none",
  braceStep_m: 3,
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
    expect(out.autoMaxStep_mm).toBe(1500);
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
      expect(best.blackMass_kg).toBeCloseTo(309.6, 4);
      expect(best.galvanizedMass_kg).toBeCloseTo(12042, 4);
      // Excel Лист1!K65/K70: H + Расчет!S87 * ROUNDUP(B8 / B47, 0) * B9.
      expect(best.massWithBraces_kg).toBeCloseTo(16959.6, 4);
      // Utilization stays under the per-thickness default coefficient.
      expect(best.K).toBeLessThanOrEqual(1);
    };
    Z350("MP350");
    Z350("MP390");
  });

  it("uses profile default_coef in default LSTK utilization mode", () => {
    const sec = out.sections.find((s) => s.grade === "MP350" && s.type === "Z");
    const best = sec!.best!;
    const expectedMpred = (best.profile.M_pred_baseline_kNm / 0.85) * best.profile.default_coef;

    expect(best.profile.default_coef).toBe(0.9);
    expect(best.M_pred_eff_kNm).toBeCloseTo(expectedMpred, 10);
    expect(best.M_pred_eff_kNm).toBeCloseTo(33.9352941176, 10);
  });

  it("fixes current gable-roof purlin line count and slope length model", () => {
    const best = out.top10[0];

    expect(out.L_slope_m).toBeCloseTo((24 - 0.3) / 2, 10);
    expect(best.nPurlins).toBe(18);
    expect(best.massPerFrameStep_kg).toBeCloseTo(1235.16, 4);
    expect(best.massPerBuilding_kg).toBeCloseTo(12351.6, 4);
    expect(best.massWithBraces_kg).toBeCloseTo(16959.6, 4);
  });

  it("applies tie installation to the effective design span like Excel Расчет!D21", () => {
    const withOneTie = runPurlinCalculation({
      ...SCN_PURLINS_001,
      tieInstallation: 1,
    });
    const best = withOneTie.sections.find((s) => s.grade === "MP350" && s.type === "Z")?.best;

    expect(best?.profile.name).toBe("Z 220х1,5");
    expect(best?.M_design_kNm).toBeCloseTo(8.1058031258, 10);
    expect(best?.K).toBeCloseTo(0.9921423655, 10);
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

describe("purlin engine — purlin family availability by roof assembly", () => {
  it("allows 2TPS only for layer-by-layer Наше roof assemblies", () => {
    expect(isLayeredAssemblyRoof("профлист")).toBe(false);
    expect(isLayeredAssemblyRoof("С-П 150 мм")).toBe(false);
    expect(isLayeredAssemblyRoof("наше 100 мм")).toBe(true);
    expect(isLayeredAssemblyRoof("наше 150 мм")).toBe(true);
    expect(isLayeredAssemblyRoof("наше 250 мм 2 слоя ГВЛ")).toBe(true);
  });

  it("does not expose 2TPS candidates for non-layered roof structures", () => {
    const out = runPurlinCalculation({
      ...SCN_PURLINS_001,
      roofStructure: "профлист",
      roofLoad_kPa: 0.105,
      cassetteHeightFilter_mm: 0,
    });

    expect(out.sections.find((section) => section.type === "2TPS")?.best).toBeNull();
    expect(out.top10.every((candidate) => candidate.profile.type !== "2TPS")).toBe(true);
  });
});

describe("purlin engine — Excel acceptance SCN-PURLINS-002 (extra snow guard purlin)", () => {
  const out = runPurlinCalculation({
    ...SCN_PURLINS_001,
    snowGuardPurlin: true,
  });

  it("keeps the base load model and adds one physical purlin line", () => {
    expect(out.q_snow_kPa).toBeCloseTo(4.240134, 4);
    expect(out.q_roof_kPa).toBeCloseTo(0.32028, 5);
    expect(out.q_total_kPa).toBeCloseTo(4.774239, 4);
    expect(out.mu2).toBe(1);
    expect(out.autoMaxStep_mm).toBe(1500);
    expect(out.L_slope_m).toBeCloseTo((24 - 0.3) / 2, 10);
  });

  it("selects the same Z profile but increases the line count and mass", () => {
    const best = out.top10[0];

    expect(best.profile.name).toBe("Z 350х2,5");
    expect(best.spacing_mm).toBe(1500);
    expect(best.nPurlins).toBe(20);
    expect(best.massPerBuilding_kg).toBeCloseTo(13724, 4);
    expect(best.blackMass_kg).toBeCloseTo(344, 4);
    expect(best.galvanizedMass_kg).toBeCloseTo(13380, 4);
    expect(best.massWithBraces_kg).toBeCloseTo(18332, 4);
    expect(best.K).toBeCloseTo(0.9644195919, 10);
  });
});

describe("purlin engine — Excel acceptance SCN-PURLINS-003 (manual max step 1200)", () => {
  const out = runPurlinCalculation({
    ...SCN_PURLINS_001,
    minStep_mm: 500,
    maxStep_mm: 1200,
  });

  it("uses the manual maximum step constraint", () => {
    expect(out.autoMaxStep_mm).toBe(1200);
    expect(out.q_total_kPa).toBeCloseTo(4.774239, 4);
    expect(out.top10.length).toBeGreaterThan(0);
  });

  it("selects Z 350x2 at the constrained step", () => {
    const best = out.top10[0];

    expect(best.profile.name).toBe("Z 350х2");
    expect(best.spacing_mm).toBe(1185);
    expect(best.nPurlins).toBe(22);
    expect(best.massPerBuilding_kg).toBeCloseTo(12126.4, 4);
    expect(best.blackMass_kg).toBeCloseTo(378.4, 4);
    expect(best.galvanizedMass_kg).toBeCloseTo(11748, 4);
    expect(best.massWithBraces_kg).toBeCloseTo(16734.4, 4);
    expect(best.K).toBeCloseTo(0.9842098225, 10);
  });
});
