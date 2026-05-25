import { describe, expect, it } from "vitest";
import type { WindowRiegelResult } from "./calc/windowRiegel/types";
import { buildWindowRiegelResultItem } from "./windowRiegelResultPublisher";

function result(patch: Partial<WindowRiegelResult> = {}): WindowRiegelResult {
  return {
    verticalLoadKpa: 0.42,
    horizontalLoadKpa: 0.87,
    outOfPlaneLengthM: 6,
    inPlaneLengthM: 5,
    effectiveWindLoadKpa: 0.3,
    climateSettlement: null,
    lowerAndUpperProfiles: [],
    upperType1Profiles: [],
    warnings: [],
    ...patch,
  };
}

describe("window riegel result publisher", () => {
  it("returns null when no top lower/upper riegel option is available", () => {
    expect(buildWindowRiegelResultItem(null)).toBeNull();
    expect(buildWindowRiegelResultItem(result())).toBeNull();
    expect(buildWindowRiegelResultItem(result({
      lowerAndUpperProfiles: [{
        number: 1,
        profile: null,
        steel: "С245",
        weightKg: 87,
      }],
    }))).toBeNull();
    expect(buildWindowRiegelResultItem(result({
      lowerAndUpperProfiles: [{
        number: 1,
        profile: "кв.120х4",
        steel: "С245",
        weightKg: null,
      }],
    }))).toBeNull();
  });

  it("publishes top lower/upper option as one per-piece summary item", () => {
    const item = buildWindowRiegelResultItem(result({
      lowerAndUpperProfiles: [{
        number: 1,
        profile: "кв.120х4",
        steel: "С245",
        weightKg: 87.0017,
      }],
    }));

    expect(item).toEqual({
      profile: "кв.120х4",
      steel: "С245",
      massPerPiece_kg: 87.0017,
      count: 1,
      totalMass_kg: 87.0017,
      cost_rub: 0,
    });
  });

  it("keeps missing steel visible as a placeholder", () => {
    const item = buildWindowRiegelResultItem(result({
      lowerAndUpperProfiles: [{
        number: 1,
        profile: "кв.120х4",
        steel: null,
        weightKg: 87.0017,
      }],
    }));

    expect(item?.steel).toBe("—");
  });
});
