import { describe, expect, it } from "vitest";
import type { MemberSolution } from "./calc/beamCell/types";
import { buildBeamCellResultItem } from "./beamCellResultPublisher";

function solution(patch: Partial<MemberSolution> = {}): MemberSolution {
  return {
    status: "OK",
    material: "C245",
    profile: "40 Б2",
    weightKg: 792,
    costRub: 153_000,
    utilization: 0.8,
    ...patch,
  };
}

describe("beam cell result publisher", () => {
  it("returns null for non-selected or incomplete main beam solution", () => {
    const common = { length_m: 72, framePitch_m: 6, spanCount: "single" as const };

    expect(buildBeamCellResultItem({
      ...common,
      solution: undefined,
    })).toBeNull();
    expect(buildBeamCellResultItem({
      ...common,
      solution: solution({ status: "NO_SOLUTION", profile: undefined }),
    })).toBeNull();
    expect(buildBeamCellResultItem({
      ...common,
      solution: solution({ weightKg: undefined }),
    })).toBeNull();
  });

  it("publishes end roof beam count for a single-span building", () => {
    const item = buildBeamCellResultItem({
      solution: solution(),
      length_m: 72,
      framePitch_m: 6,
      spanCount: "single",
    });

    expect(item).toEqual({
      profile: "40 Б2",
      steel: "С245",
      massPerPiece_kg: 792,
      count: 2,
      totalMass_kg: 1_584,
      cost_rub: 306_000,
    });
  });

  it("publishes doubled end roof beam count for a multi-span building", () => {
    const item = buildBeamCellResultItem({
      solution: solution({
        material: "C345",
        profile: "35 Б2",
        weightKg: 595.2,
        costRub: 121_000,
      }),
      length_m: 72,
      framePitch_m: 6,
      spanCount: "multi",
    });

    expect(item).toEqual({
      profile: "35 Б2",
      steel: "С345",
      massPerPiece_kg: 595.2,
      count: 4,
      totalMass_kg: 2_380.8,
      cost_rub: 484_000,
    });
  });
});
