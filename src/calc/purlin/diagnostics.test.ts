import { describe, expect, it } from "vitest";
import { buildPurlinSelectionDiagnostics } from "./diagnostics";
import { runPurlinCalculation } from "./engine";
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
  roofStructure: "S-P 150 mm",
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

describe("purlin selection diagnostics", () => {
  it("explains current LSTK family winners without changing calculation output", () => {
    const output = runPurlinCalculation(SCN_PURLINS_001);
    const diagnostics = buildPurlinSelectionDiagnostics(SCN_PURLINS_001, output);

    expect(diagnostics.familyDiagnostics).toHaveLength(6);
    expect(diagnostics.selectedOverallProfileName).toBe(output.top10[0].profile.name);
    expect(diagnostics.selectedOverallType).toBe("Z");
    expect(
      diagnostics.familyDiagnostics.filter((item) => item.status === "no_candidate").map((item) => item.type),
    ).toEqual(["2TPS", "2PS", "2TPS", "2PS"]);
    const rejected2Tps = diagnostics.familyDiagnostics.find(
      (item) => item.grade === "MP350" && item.type === "2TPS",
    );
    expect(rejected2Tps?.notes.join(" ")).toContain("Best rejected variant");
    expect(rejected2Tps?.notes.join(" ")).toContain("K=");
    expect(diagnostics.oracleOnlyParameters).toContain("requiresPanelFilter");
    expect(diagnostics.warnings.join(" ")).toContain("Tie installation is applied");
    expect(diagnostics.warnings.join(" ")).toContain("Default LSTK utilization mode uses profile default_coef");
  });

  it("mentions panel assembly height filter when no candidate is available in a family", () => {
    const input: PurlinInput = {
      ...SCN_PURLINS_001,
      cassetteHeightFilter_mm: 999,
    };
    const output = runPurlinCalculation(input);
    const diagnostics = buildPurlinSelectionDiagnostics(input, output);

    expect(output.top10).toHaveLength(0);
    expect(diagnostics.familyDiagnostics.every((item) => item.status === "no_candidate")).toBe(true);
    expect(diagnostics.familyDiagnostics[0].notes.join(" ")).toContain("999 mm");
  });
});
