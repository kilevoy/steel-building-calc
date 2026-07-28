import { describe, expect, it } from "vitest";
import { buildWindowRiegelResultItem } from "./windowRiegelResultPublisher";
import { getUsableWindowRiegelOptions } from "./windowRiegelOptionVisibility";
import type { WindowRiegelResult } from "./calc/windowRiegel/types";

function resultWithOptions(): WindowRiegelResult {
  return {
    verticalLoadKpa: 0.42,
    horizontalLoadKpa: null,
    outOfPlaneLengthM: 6,
    inPlaneLengthM: 6,
    effectiveWindLoadKpa: 0.38,
    climateSettlement: null,
    lowerAndUpperProfiles: [
      { number: 1, profile: "#N/A", steel: "#N/A", weightKg: null },
      { number: 2, profile: "25 Ш1", steel: "С245", weightKg: 42.5 },
    ],
    upperType1Profiles: [],
    warnings: [],
  };
}

describe("window riegel option visibility", () => {
  it("hides workbook error placeholders from displayed options", () => {
    expect(getUsableWindowRiegelOptions(resultWithOptions().lowerAndUpperProfiles)).toEqual([
      { number: 2, profile: "25 Ш1", steel: "С245", weightKg: 42.5 },
    ]);
  });

  it("does not publish workbook error placeholders to the building summary", () => {
    const noCandidates = resultWithOptions();
    noCandidates.lowerAndUpperProfiles = [
      { number: 1, profile: "#N/A", steel: "#N/A", weightKg: null },
    ];

    expect(buildWindowRiegelResultItem(noCandidates)).toBeNull();
  });
});
