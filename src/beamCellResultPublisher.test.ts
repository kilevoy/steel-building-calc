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
    const common = {
      length_m: 72,
      framePitch_m: 6,
      span_m: 24,
      roofSlope_deg: 5,
      roofShape: "gable" as const,
      spanCount: "single" as const,
    };

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
      span_m: 24,
      roofSlope_deg: 5,
      roofShape: "gable",
      spanCount: "single",
    });

    expect(item).toMatchObject({
      profile: "40 Б2",
      steel: "С245",
      massPerPiece_kg: 792,
      count: 4,
      totalMass_kg: 3_168,
      cost_rub: 612_000,
      note: "торцы, 2 ската",
    });
    expect(item?.lengthPerPiece_m).toBeCloseTo(12 / Math.cos((5 * Math.PI) / 180), 10);
    expect(item?.totalLength_m).toBeCloseTo(4 * 12 / Math.cos((5 * Math.PI) / 180), 10);
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
      span_m: 24,
      roofSlope_deg: 0,
      roofShape: "monoslope",
      spanCount: "multi",
    });

    expect(item).toMatchObject({
      profile: "35 Б2",
      steel: "С345",
      massPerPiece_kg: 595.2,
      count: 4,
      totalMass_kg: 2_380.8,
      cost_rub: 484_000,
      lengthPerPiece_m: 12,
      totalLength_m: 48,
      note: "торцы, 1 скат",
    });
  });
});
