import { describe, expect, it } from "vitest";
import {
  columnHeightAtX,
  deriveEndRoofBeamQuantity,
  deriveColumnLayout,
  deriveFrameLayout,
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
});
