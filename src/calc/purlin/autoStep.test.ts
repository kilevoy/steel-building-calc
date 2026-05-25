import { describe, expect, it } from "vitest";
import {
  computePurlinAutoMaxStepMm,
  getPurlinRoofConstructionLoadKpa,
  resolvePurlinAutoStepIndex,
} from "./autoStep";
import { computeLoads } from "./engine";
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

describe("purlin workbook auto max step", () => {
  it("matches EXCEL-009 auto max step for SCN-PURLINS-001", () => {
    const loads = computeLoads(SCN_PURLINS_001);

    expect(resolvePurlinAutoStepIndex({
      roofStructure: SCN_PURLINS_001.roofStructure,
      deckProfile: "С44-1000-0,7",
    })).toBe(9);
    expect(getPurlinRoofConstructionLoadKpa(SCN_PURLINS_001.roofStructure)).toBeCloseTo(0.32028, 5);
    expect(computePurlinAutoMaxStepMm({
      input: SCN_PURLINS_001,
      q_snow_kPa: loads.q_snow_kPa,
      q_windRoof_kPa: loads.q_windRoof_kPa,
    })).toBe(1500);
  });

  it("uses deck profile auto-step index when roof construction has no fixed index", () => {
    expect(resolvePurlinAutoStepIndex({
      roofStructure: "профлист",
      deckProfile: "Н60-845-0,7",
    })).toBe(3);
  });

  it("uses the input deck profile for auto-step calculation", () => {
    const loads = computeLoads(SCN_PURLINS_001);
    const input: PurlinInput = {
      ...SCN_PURLINS_001,
      roofStructure: "профлист",
      deckProfile: "Н60-845-0,8",
      maxStep_mm: 3000,
    };

    expect(computePurlinAutoMaxStepMm({
      input,
      q_snow_kPa: loads.q_snow_kPa,
      q_windRoof_kPa: loads.q_windRoof_kPa,
    })).toBe(2200);
  });
});
