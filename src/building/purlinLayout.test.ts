import { describe, expect, it } from "vitest";
import { derivePurlinSegmentLayout, deriveUniformPurlinSegmentLayout } from "./purlinLayout";

describe("purlin segment layout", () => {
  it("derives physical purlin pieces for the current uniform app model", () => {
    const layout = deriveUniformPurlinSegmentLayout({
      length_m: 60,
      framePitch_m: 6,
      lineCount: 18,
    });

    expect(layout.continuity).toBe("simply_supported");
    expect(layout.segmentsPerLine).toBe(10);
    expect(layout.designSpansPerLine).toBe(10);
    expect(layout.totalPieces).toBe(180);
    expect(layout.totalLengthPerLine_m).toBe(60);
    expect(layout.totalLinearLength_m).toBe(1080);
    expect(layout.uniqueSegmentLengths_m).toEqual([6]);
  });

  it("keeps non-uniform KM bay lengths instead of flattening them to one frame pitch", () => {
    const layout = derivePurlinSegmentLayout({
      bayLengths_m: [5.1, 5.1, 5, 5, 5, 5, 5, 5, 5.1, 5.1],
      lineCount: 1,
    });

    expect(layout.segmentsPerLine).toBe(10);
    expect(layout.totalPieces).toBe(10);
    expect(layout.totalLengthPerLine_m).toBe(50.4);
    expect(layout.uniqueSegmentLengths_m).toEqual([5, 5.1]);
    expect(layout.baySegments[0]).toEqual({
      bayIndex: 0,
      startAxisIndex: 1,
      endAxisIndex: 2,
      length_m: 5.1,
    });
  });

  it("keeps continuous purlin continuity explicit without changing physical piece count", () => {
    const layout = derivePurlinSegmentLayout({
      bayLengths_m: [6, 6, 6],
      lineCount: 2,
      continuity: "continuous",
    });

    expect(layout.continuity).toBe("continuous");
    expect(layout.segmentsPerLine).toBe(3);
    expect(layout.designSpansPerLine).toBe(1);
    expect(layout.totalPieces).toBe(6);
    expect(layout.totalLengthPerLine_m).toBe(18);
    expect(layout.totalLinearLength_m).toBe(36);
  });

  it("drops invalid bay lengths and returns an empty layout for invalid spacing input", () => {
    const explicit = derivePurlinSegmentLayout({
      bayLengths_m: [6, 0, Number.NaN, -1, 6],
      lineCount: 2,
    });
    const uniform = deriveUniformPurlinSegmentLayout({
      length_m: 42,
      framePitch_m: 0,
      lineCount: 18,
    });

    expect(explicit.segmentsPerLine).toBe(2);
    expect(explicit.totalPieces).toBe(4);
    expect(explicit.totalLinearLength_m).toBe(24);
    expect(uniform.segmentsPerLine).toBe(0);
    expect(uniform.totalPieces).toBe(0);
  });
});
