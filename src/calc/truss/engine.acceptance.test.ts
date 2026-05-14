import { describe, expect, it } from "vitest";
import { runTrussCalculation } from "./engine";
import type { TrussInput } from "./types";

/**
 * Acceptance test for the truss engine vs SCN-TRUSS-001.
 *
 * Source: knowledge/wiki/parity/scenarios/SCN-TRUSS-001.md (EXCEL-008,
 * "Калькулятор ферм типа Молодечно v1.0.xlsx").
 *
 * IMPORTANT — input parity caveat:
 *   The source workbook bakes a fixed load addition of 15 % into
 *   'Единичные эпюры'!B11. The first time we wired this scenario with
 *   loadAddition_pct = 0 the engine selected lighter profiles for ВП
 *   and НП and we mis-identified it as a formula bug. With the correct
 *   loadAddition_pct = 15 the engine matches Excel one-to-one on every
 *   selected profile. The engine formulas were NOT changed; only the
 *   scenario inputs.
 *
 * Per knowledge/AGENTS.md: do NOT modify engine formulas to make this
 * test pass. A drift means either the engine logic changed (review the
 * change) or the scenario inputs no longer match Excel.
 */
const SCN_TRUSS_001: TrussInput = {
  height_m: 12,
  span_m: 24,
  length_m: 30,
  framePitch_m: 6,
  // Excel B12 = 0 mm: prog purlins not used as bracing → 3 m default.
  purlinPitch_mm: 0,
  roofSlope_deg: 6,
  responsibilityCoeff: 1,
  terrainType: "B",
  w0_kPa: 0.3,
  Sg_kPa: 1.2,
  roofStructure: "наше 250 мм",
  roofLoad_kPa: 0.24,
  // Excel 'Единичные эпюры'!B11 = 15 (default in workbook).
  loadAddition_pct: 15,
  maxUtilization: 0.85,
  minThickness_mm: { VP: 4, NP: 4, ORb: 4, OR: 4, RR: 3 },
  maxWidth_mm: { VP: 500, NP: 500 },
  minWidth_mm: { ORb: 80, OR: 80, RR: 60 },
};

describe("truss engine — Excel acceptance SCN-TRUSS-001", () => {
  const out = runTrussCalculation(SCN_TRUSS_001);

  it("computes design loads (snow / wind / roof) per SP 20", () => {
    // Excel 'Единичные эпюры' D1/D2/D3 — load × γn × frame_pitch.
    // q_snow = 1.4 × 1.1 × 1.13 × Sg × cos(α) × γn × frame_pitch
    expect(out.loads.snow_kN_per_m).toBeCloseTo(12.460802, 4);
    // q_roof = roof_load × γn × frame_pitch
    expect(out.loads.roof_kN_per_m).toBeCloseTo(1.44, 4);
    // q_wind from FGH+ zone via calcWind. Excel: ~0.6415 kN/m.
    expect(out.loads.wind_kN_per_m).toBeCloseTo(0.641474, 4);
  });

  it("computes section forces matching Excel 'Единичные эпюры'!D7..M7", () => {
    // ВП (top chord) forces — Excel D7/E7/F7 with 15 % addition.
    expect(out.sections.VP.forces.N_kN).toBeCloseTo(629.362821, 3);
    expect(out.sections.VP.forces.M_kNm).toBeCloseTo(20.510959, 3);
    expect(out.sections.VP.forces.Q_kN).toBeCloseTo(197.511327, 3);
    // НП (bottom chord) tension — Excel G7.
    expect(out.sections.NP.forces.N_kN).toBeCloseTo(639.323222, 3);
    // ОРб (support diagonal) — Excel H7/I7.
    expect(out.sections.ORb.forces.Np_kN).toBeCloseTo(303.577203, 3);
    expect(out.sections.ORb.forces.Nm_kN).toBeCloseTo(236.190681, 3);
    // ОР — Excel J7/K7.
    expect(out.sections.OR.forces.Np_kN).toBeCloseTo(122.273107, 3);
    expect(out.sections.OR.forces.Nm_kN).toBeCloseTo(102.555552, 3);
    // РР — Excel L7/M7.
    expect(out.sections.RR.forces.Np_kN).toBeCloseTo(29.291048, 3);
    expect(out.sections.RR.forces.Nm_kN).toBeCloseTo(24.421501, 3);
  });

  it("ВП selects тр.200х160х6 with mass 889.45 kg (Excel B15:C15)", () => {
    const sel = out.sections.VP.selected;
    expect(sel?.profile.name).toBe("тр.200х160х6");
    expect(sel!.totalMass_kg).toBeCloseTo(889.452049, 3);
    expect(sel!.maxUtilization).toBeCloseTo(0.780168, 4);
  });

  it("НП selects тр.120х5 with mass 435.94 kg (Excel B15:C15)", () => {
    const sel = out.sections.NP.selected;
    expect(sel?.profile.name).toBe("тр.120х5");
    expect(sel!.totalMass_kg).toBeCloseTo(435.942091, 3);
    expect(sel!.maxUtilization).toBeCloseTo(0.849481, 4);
  });

  it("ОРб selects тр.80х4 with mass 80.58 kg", () => {
    const sel = out.sections.ORb.selected;
    expect(sel?.profile.name).toBe("тр.80х4");
    expect(sel!.totalMass_kg).toBeCloseTo(80.5828, 3);
  });

  it("ОР selects тр.80х4 with mass 84.82 kg", () => {
    const sel = out.sections.OR.selected;
    expect(sel?.profile.name).toBe("тр.80х4");
    expect(sel!.totalMass_kg).toBeCloseTo(84.824, 3);
  });

  it("РР selects тр.60х3 with mass 109.82 kg", () => {
    const sel = out.sections.RR.selected;
    expect(sel?.profile.name).toBe("тр.60х3");
    expect(sel!.totalMass_kg).toBeCloseTo(109.8204, 3);
  });

  it("total mass = sum of sections + 19.24 kg fittings (Excel B59 formula)", () => {
    const selectedSum = (["VP", "NP", "ORb", "OR", "RR"] as const).reduce(
      (s, k) => s + (out.sections[k].selected?.totalMass_kg ?? 0),
      0,
    );
    // Excel adds 2*2*4.81 = 19.24 kg of fittings (gussets etc.) per
    // workbook formula B59. Engine reproduces the same constant.
    expect(out.totalMass_kg - selectedSum).toBeCloseTo(19.24, 6);
    // Total per SCN-TRUSS-001: 1619.86 kg.
    expect(out.totalMass_kg).toBeCloseTo(1619.861488, 3);
  });
});
