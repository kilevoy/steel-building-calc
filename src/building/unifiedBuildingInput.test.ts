import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDING } from "./buildingContext";
import {
  deriveUnifiedBuildingLayoutFromBuilding,
  deriveUnifiedBuildingLayoutInput,
} from "./unifiedBuildingInput";

describe("unified building input bridge", () => {
  it("derives frame axes and span count from the shared building state", () => {
    const input = deriveUnifiedBuildingLayoutInput({
      ...DEFAULT_BUILDING,
      length_m: 72,
      framePitch_m: 6,
      spanCount: "multi",
      hasCrane: false,
    });

    expect(input).toEqual({
      mainFrameAxisCount: 13,
      crossSpanCount: 2,
      hasCrane: false,
    });
  });

  it("keeps end columns in fachwerk when the building has no crane", () => {
    const layout = deriveUnifiedBuildingLayoutFromBuilding({
      ...DEFAULT_BUILDING,
      length_m: 72,
      framePitch_m: 6,
      spanCount: "multi",
      hasCrane: false,
    });

    expect(layout.columns.mainTotal).toBe(33);
    expect(layout.columns.endFachwerkTotal).toBe(6);
  });

  it("uses central bays and symmetric end bays to count frame axes", () => {
    const input = deriveUnifiedBuildingLayoutInput({
      ...DEFAULT_BUILDING,
      length_m: 38,
      framePitch_m: 6,
      frameLayoutMode: "central_with_end_bays",
      centralBayCount: 5,
    });

    expect(input.mainFrameAxisCount).toBe(8);
    expect(deriveUnifiedBuildingLayoutFromBuilding({
      ...DEFAULT_BUILDING,
      length_m: 38,
      framePitch_m: 6,
      frameLayoutMode: "central_with_end_bays",
      centralBayCount: 5,
    }).frames).toMatchObject({
      totalFrameAxes: 8,
      interiorFrameAxes: 6,
      frameBays: 7,
    });
  });

  it("counts end columns as main frame columns when the building has a crane", () => {
    const layout = deriveUnifiedBuildingLayoutFromBuilding({
      ...DEFAULT_BUILDING,
      length_m: 72,
      framePitch_m: 6,
      spanCount: "multi",
      hasCrane: true,
    });

    expect(layout.columns.mainTotal).toBe(39);
    expect(layout.columns.endFachwerkTotal).toBe(0);
  });
});
