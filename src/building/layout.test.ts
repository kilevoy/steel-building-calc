import { describe, expect, it } from "vitest";
import {
  columnHeightAtX,
  deriveEndRoofBeamQuantity,
  deriveColumnLayout,
  deriveFrameLayout,
  deriveRoofElementLayout,
  positionsAcrossSpan,
} from "./layout";

describe("building layout helpers", () => {
  it("counts interior frames separately from end axes", () => {
    expect(deriveFrameLayout(60, 6)).toEqual({
      frameCount: 11,
      interiorFrameCount: 9,
    });
  });

  it("counts end roof beams by span count", () => {
    expect(deriveEndRoofBeamQuantity("single")).toBe(2);
    expect(deriveEndRoofBeamQuantity("multi")).toBe(4);
  });

  it("derives roof element counts from the same frame model", () => {
    expect(
      deriveRoofElementLayout({
        length_m: 60,
        framePitch_m: 6,
        spanCount: "single",
      }),
    ).toEqual({
      frameCount: 11,
      interiorFrameCount: 9,
      trussCount: 9,
      endRoofBeamCount: 2,
    });
  });

  it("counts multi-span end roof beams per span on both end frames", () => {
    expect(
      deriveRoofElementLayout({
        length_m: 60,
        framePitch_m: 6,
        spanCount: "multi",
      }).endRoofBeamCount,
    ).toBe(4);
  });

  it("counts end fakhverk positions across the full span including edges", () => {
    expect(positionsAcrossSpan(24, 6)).toEqual([0, 6, 12, 18, 24]);
  });

  it("derives column counts using interior axes and end fakhverk", () => {
    const layout = deriveColumnLayout({
      span_m: 24,
      length_m: 60,
      height_m: 12,
      framePitch_m: 6,
      fachverkPitch_m: 6,
      roofSlope_deg: 6,
      roofType: "gable",
      spanCount: "single",
    });

    expect(layout.edge.count).toBe(18);
    expect(layout.middle.count).toBe(0);
    expect(layout.fachwerk.count).toBe(10);
  });

  it("accounts for roof type and slope in column heights", () => {
    const gableMiddle = columnHeightAtX({
      span_m: 24,
      height_m: 12,
      roofSlope_deg: 6,
      roofType: "gable",
      x_m: 12,
    });
    const monoslopeFarEdge = columnHeightAtX({
      span_m: 24,
      height_m: 12,
      roofSlope_deg: 6,
      roofType: "single_slope",
      x_m: 24,
    });

    expect(gableMiddle).toBeGreaterThan(12);
    expect(monoslopeFarEdge).toBeGreaterThan(gableMiddle);
  });

  it("keeps gable roof column heights symmetric across the span", () => {
    const leftQuarter = columnHeightAtX({
      span_m: 24,
      height_m: 12,
      roofSlope_deg: 6,
      roofType: "gable",
      x_m: 6,
    });
    const rightQuarter = columnHeightAtX({
      span_m: 24,
      height_m: 12,
      roofSlope_deg: 6,
      roofType: "gable",
      x_m: 18,
    });
    const ridge = columnHeightAtX({
      span_m: 24,
      height_m: 12,
      roofSlope_deg: 6,
      roofType: "gable",
      x_m: 12,
    });

    expect(leftQuarter).toBeCloseTo(rightQuarter, 10);
    expect(ridge).toBeCloseTo(12 + 12 * Math.tan((6 * Math.PI) / 180), 10);
  });

  it("keeps monoslope roof column height increasing from low to high edge", () => {
    const lowEdge = columnHeightAtX({
      span_m: 24,
      height_m: 12,
      roofSlope_deg: 6,
      roofType: "single_slope",
      x_m: 0,
    });
    const highEdge = columnHeightAtX({
      span_m: 24,
      height_m: 12,
      roofSlope_deg: 6,
      roofType: "single_slope",
      x_m: 24,
    });

    expect(lowEdge).toBe(12);
    expect(highEdge).toBeCloseTo(12 + 24 * Math.tan((6 * Math.PI) / 180), 10);
  });

  it("uses roof-dependent heights for edge, middle and fakhverk column groups", () => {
    const layout = deriveColumnLayout({
      span_m: 24,
      length_m: 60,
      height_m: 12,
      framePitch_m: 6,
      fachverkPitch_m: 6,
      roofSlope_deg: 6,
      roofType: "gable",
      spanCount: "multi",
    });
    const ridgeHeight = 12 + 12 * Math.tan((6 * Math.PI) / 180);

    expect(layout.edge.count).toBe(18);
    expect(layout.edge.maxHeight_m).toBeCloseTo(12, 10);
    expect(layout.edge.totalHeight_m).toBeCloseTo(18 * 12, 10);
    expect(layout.middle.count).toBe(9);
    expect(layout.middle.maxHeight_m).toBeCloseTo(ridgeHeight, 10);
    expect(layout.middle.totalHeight_m).toBeCloseTo(9 * ridgeHeight, 10);
    expect(layout.fachwerk.count).toBe(10);
    expect(layout.fachwerk.maxHeight_m).toBeCloseTo(ridgeHeight, 10);
  });
});
