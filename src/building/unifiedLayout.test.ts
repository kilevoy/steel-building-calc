import { describe, expect, it } from "vitest";
import { deriveUnifiedBuildingLayout } from "./unifiedLayout";

describe("unified building layout helpers", () => {
  it("keeps end frames separate for SCN-BUILDING-COUNT-001", () => {
    const layout = deriveUnifiedBuildingLayout({
      mainFrameAxisCount: 12,
      crossSpanCount: 6,
    });

    expect(layout.frames).toEqual({
      totalFrameAxes: 12,
      interiorFrameAxes: 10,
      endFrameAxes: 2,
      frameBays: 11,
      extraFrameAxes: 0,
    });
    expect(layout.columns).toMatchObject({
      edgePerFrame: 2,
      middlePerFrame: 5,
      totalPerFrame: 7,
      interiorEdge: 20,
      interiorMiddle: 50,
      interiorTotal: 70,
      endEdge: 4,
      endMiddle: 10,
      endTotal: 14,
      allEdge: 24,
      allMiddle: 60,
      allTotal: 84,
    });
  });

  it("tracks extra frame axes separately for SCN-BUILDING-COUNT-002", () => {
    const layout = deriveUnifiedBuildingLayout({
      mainFrameAxisCount: 20,
      crossSpanCount: 2,
      extraFrameAxisCount: 1,
    });

    expect(layout.frames).toEqual({
      totalFrameAxes: 20,
      interiorFrameAxes: 18,
      endFrameAxes: 2,
      frameBays: 19,
      extraFrameAxes: 1,
    });
    expect(layout.columns).toMatchObject({
      edgePerFrame: 2,
      middlePerFrame: 1,
      totalPerFrame: 3,
      interiorEdge: 36,
      interiorMiddle: 18,
      interiorTotal: 54,
      endEdge: 4,
      endMiddle: 2,
      endTotal: 6,
      allEdge: 40,
      allMiddle: 20,
      allTotal: 60,
    });
  });

  it("supports four-span frame counts for SCN-BUILDING-COUNT-003", () => {
    const layout = deriveUnifiedBuildingLayout({
      mainFrameAxisCount: 13,
      crossSpanCount: 4,
    });

    expect(layout.frames).toEqual({
      totalFrameAxes: 13,
      interiorFrameAxes: 11,
      endFrameAxes: 2,
      frameBays: 12,
      extraFrameAxes: 0,
    });
    expect(layout.columns).toMatchObject({
      edgePerFrame: 2,
      middlePerFrame: 3,
      totalPerFrame: 5,
      interiorEdge: 22,
      interiorMiddle: 33,
      interiorTotal: 55,
      endEdge: 4,
      endMiddle: 6,
      endTotal: 10,
      allEdge: 26,
      allMiddle: 39,
      allTotal: 65,
    });
  });
});
