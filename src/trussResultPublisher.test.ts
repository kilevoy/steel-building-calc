import { describe, expect, it } from "vitest";
import {
  type ProfileEvaluation,
  type SectionResult,
  type TrussOutput,
  type TrussSection,
} from "./calc/truss/types";
import { buildTrussResultPayload } from "./trussResultPublisher";

function selected(profileName: string, totalMass_kg: number): ProfileEvaluation {
  return {
    profile: {
      name: profileName,
      h_mm: 100,
      b_mm: 100,
      t_mm: 4,
      A_cm2: 10,
      Ix_cm4: 100,
      Wx_cm3: 20,
      ix_cm: 3,
      Sx_cm3: 10,
      Iy_cm4: 100,
      Wy_cm3: 20,
      iy_cm: 3,
      mass_kg_per_m: 12,
      excluded: false,
    },
    Ry_MPa: 345,
    lambda_x: 0,
    lambda_y: 0,
    checks: {},
    maxUtilization: 0.5,
    limitingCheck: "test",
    passes: true,
    failReason: null,
    totalMass_kg,
  };
}

function outputWithSelectedSections(masses: Partial<Record<TrussSection, number>>): TrussOutput {
  const sectionResult = (section: TrussSection): SectionResult => ({
    section,
    forces: { N_kN: 0, M_kNm: 0, Q_kN: 0 },
    lefx_m: 0,
    lefy_m: 0,
    member_length_m: 0,
    candidates: [],
    selected: masses[section] == null ? null : selected(`${section}-profile`, masses[section]),
  });
  const sections: TrussOutput["sections"] = {
    VP: sectionResult("VP"),
    NP: sectionResult("NP"),
    ORb: sectionResult("ORb"),
    OR: sectionResult("OR"),
    RR: sectionResult("RR"),
  };

  return {
    loads: {
      roof_kN_per_m: 10,
      snow_kN_per_m: 20,
      wind_kN_per_m: 5,
    },
    sections,
    totalMass_kg: Object.values(masses).reduce((sum, mass) => sum + (mass ?? 0), 0),
    unitMass_kg_per_m2: 12.5,
    warnings: [],
  };
}

describe("truss result publisher", () => {
  it("publishes selected truss sections for interior frames only", () => {
    const output = outputWithSelectedSections({
      VP: 100,
      NP: 80,
      ORb: 30,
    });

    const payload = buildTrussResultPayload({
      input: {
        length_m: 72,
        framePitch_m: 6,
        span_m: 24,
      },
      output,
      spanCount: "single",
      priceC345_rubKg: 150,
    });

    expect(payload.n_trusses).toBe(11);
    expect(payload.sections).toEqual([
      { section: "ВП", profile: "VP-profile", steel: "С345", totalMass_kg: 1_100 },
      { section: "НП", profile: "NP-profile", steel: "С345", totalMass_kg: 880 },
      { section: "ОРб", profile: "ORb-profile", steel: "С345", totalMass_kg: 330 },
    ]);
    expect(payload.totalMass_kg).toBe(2_310);
    expect(payload.totalCost_rub).toBe(346_500);
  });

  it("publishes support reactions and keeps horizontal reaction unresolved", () => {
    const output = outputWithSelectedSections({ VP: 100 });

    const payload = buildTrussResultPayload({
      input: {
        length_m: 30,
        framePitch_m: 6,
        span_m: 18,
      },
      output,
      spanCount: "multi",
      priceC345_rubKg: 150,
    });

    expect(payload.reactions).toEqual({
      V_perm_kN: 90,
      V_snow_kN: 180,
      V_wind_kN: 45,
      H_kN: null,
    });
  });
});
