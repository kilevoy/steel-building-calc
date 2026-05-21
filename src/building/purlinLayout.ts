export interface PurlinBaySegment {
  bayIndex: number;
  startAxisIndex: number;
  endAxisIndex: number;
  length_m: number;
}

export type PurlinContinuity = "simply_supported" | "continuous";

export interface PurlinSegmentLayout {
  continuity: PurlinContinuity;
  lineCount: number;
  baySegments: PurlinBaySegment[];
  segmentsPerLine: number;
  designSpansPerLine: number;
  totalPieces: number;
  totalLengthPerLine_m: number;
  totalLinearLength_m: number;
  uniqueSegmentLengths_m: number[];
}

function roundLength(length_m: number): number {
  return Number(length_m.toFixed(6));
}

function positiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function derivePurlinSegmentLayout(params: {
  bayLengths_m: readonly number[];
  lineCount: number;
  continuity?: PurlinContinuity;
}): PurlinSegmentLayout {
  const validBayLengths = params.bayLengths_m.filter(positiveFinite).map(roundLength);
  const lineCount = Number.isFinite(params.lineCount) && params.lineCount > 0 ? Math.floor(params.lineCount) : 0;
  const continuity = params.continuity ?? "simply_supported";

  const baySegments = validBayLengths.map((length_m, index) => ({
    bayIndex: index,
    startAxisIndex: index + 1,
    endAxisIndex: index + 2,
    length_m,
  }));
  const totalLengthPerLine_m = roundLength(validBayLengths.reduce((sum, length) => sum + length, 0));
  const totalPieces = baySegments.length * lineCount;

  return {
    continuity,
    lineCount,
    baySegments,
    segmentsPerLine: baySegments.length,
    designSpansPerLine:
      continuity === "continuous" && baySegments.length > 0 ? 1 : baySegments.length,
    totalPieces,
    totalLengthPerLine_m,
    totalLinearLength_m: roundLength(totalLengthPerLine_m * lineCount),
    uniqueSegmentLengths_m: Array.from(new Set(validBayLengths)).sort((a, b) => a - b),
  };
}

export function deriveUniformPurlinSegmentLayout(params: {
  length_m: number;
  framePitch_m: number;
  lineCount: number;
  continuity?: PurlinContinuity;
}): PurlinSegmentLayout {
  if (!positiveFinite(params.length_m) || !positiveFinite(params.framePitch_m)) {
    return derivePurlinSegmentLayout({
      bayLengths_m: [],
      lineCount: params.lineCount,
      continuity: params.continuity,
    });
  }

  const bayCount = Math.floor(params.length_m / params.framePitch_m);
  return derivePurlinSegmentLayout({
    bayLengths_m: Array.from({ length: bayCount }, () => params.framePitch_m),
    lineCount: params.lineCount,
    continuity: params.continuity,
  });
}
