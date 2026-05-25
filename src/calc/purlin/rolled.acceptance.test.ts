import { describe, expect, it } from "vitest";
import { computeLoads } from "./engine";
import {
  DEFAULT_ROLLED_PRICES,
  computeRolledPurlinAxialWindLoad_kN,
  selectRolledTop10,
  type RolledSelectionInput,
} from "./rolled";
import type { PurlinInput } from "./types";

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

describe("rolled purlin Excel acceptance", () => {
  it("computes axial wind load like Excel Расчет!D18", () => {
    expect(computeRolledPurlinAxialWindLoad_kN(SCN_PURLINS_001)).toBeCloseTo(29.6469127987, 10);
  });

  it("keeps the default rolled winner for SCN-PURLINS-001", () => {
    const loads = computeLoads(SCN_PURLINS_001);
    const cosA = Math.cos((SCN_PURLINS_001.roofSlope_deg * Math.PI) / 180);
    const qSls =
      0.5 * 1.1 * SCN_PURLINS_001.Sg_kPa * cosA * SCN_PURLINS_001.gamma_n +
      (SCN_PURLINS_001.roofLoad_kPa / 1.2) * SCN_PURLINS_001.gamma_n;
    const input: RolledSelectionInput = {
      ...SCN_PURLINS_001,
      rolledMaxK: 0.8,
      rolledPrices: DEFAULT_ROLLED_PRICES,
    };
    const top10 = selectRolledTop10(input, loads.q_total_kPa, qSls);

    expect(top10[0].profile.name).toBe("кв.160х5");
    expect(top10[0].steel).toBe("С345");
    expect(top10[0].spacing_mm).toBe(1500);
    expect(top10[0].massPerBuilding_kg).toBeCloseTo(26808.84, 4);
  });
});
