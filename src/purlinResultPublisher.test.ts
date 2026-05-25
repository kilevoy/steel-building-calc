import { describe, expect, it } from "vitest";
import type { LstkProfile, PurlinCandidate, PurlinOutput } from "./calc/purlin/types";
import { buildPurlinResultItem } from "./purlinResultPublisher";

function candidate(profile: Partial<LstkProfile>, massPerBuilding_kg: number): PurlinCandidate {
  return {
    profile: {
      name: profile.name ?? "test",
      type: profile.type ?? "Z",
      h_mm: profile.h_mm ?? 350,
      b_mm: profile.b_mm ?? null,
      t_mm: profile.t_mm ?? 2,
      M_pred_baseline_kNm: profile.M_pred_baseline_kNm ?? 1,
      default_coef: profile.default_coef ?? 0.85,
      mass_kg_per_m: profile.mass_kg_per_m ?? 5,
      Ry_MPa: profile.Ry_MPa ?? 350,
    },
    spacing_mm: 1500,
    M_pred_eff_kNm: 1,
    M_design_kNm: 0.5,
    K: 0.5,
    nPurlins: 20,
    massPerFrameStep_kg: 10,
    massPerBuilding_kg,
    blackMass_kg: null,
    galvanizedMass_kg: null,
    massWithBraces_kg: massPerBuilding_kg,
  };
}

function output(top10: PurlinCandidate[]): PurlinOutput {
  return {
    q_total_kPa: 0,
    q_snow_kPa: 0,
    q_windRoof_kPa: 0,
    q_roof_kPa: 0,
    mu2: 1,
    designSpan_m: 24,
    autoMaxStep_mm: null,
    L_slope_m: 12,
    sections: [],
    top10,
  };
}

describe("purlin result publisher", () => {
  it("returns null when purlin calculation has no candidates", () => {
    expect(buildPurlinResultItem(output([]), {
      priceMP350_rubKg: 180,
      priceMP390_rubKg: 180,
    })).toBeNull();
    expect(buildPurlinResultItem(null, {
      priceMP350_rubKg: 180,
      priceMP390_rubKg: 180,
    })).toBeNull();
  });

  it("publishes MP350 candidate with MP350 price", () => {
    const item = buildPurlinResultItem(output([
      candidate({ name: "Z 350x2", Ry_MPa: 350 }, 12_126.4),
    ]), {
      priceMP350_rubKg: 180,
      priceMP390_rubKg: 200,
    });

    expect(item).toEqual({
      profile: "Z 350x2",
      steel: "МП350",
      totalMass_kg: 12_126.4,
      cost_rub: 12_126.4 * 180,
    });
  });

  it("publishes MP390 candidate with MP390 price", () => {
    const item = buildPurlinResultItem(output([
      candidate({ name: "Z 350x2.5", Ry_MPa: 390 }, 13_724),
    ]), {
      priceMP350_rubKg: 180,
      priceMP390_rubKg: 210,
    });

    expect(item).toEqual({
      profile: "Z 350x2.5",
      steel: "МП390",
      totalMass_kg: 13_724,
      cost_rub: 13_724 * 210,
    });
  });
});
