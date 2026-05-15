export interface UnifiedFrameLayout {
  totalFrameAxes: number;
  interiorFrameAxes: number;
  endFrameAxes: number;
  frameBays: number;
  extraFrameAxes: number;
}

export interface UnifiedColumnCounts {
  edgePerFrame: number;
  middlePerFrame: number;
  totalPerFrame: number;
  interiorEdge: number;
  interiorMiddle: number;
  interiorTotal: number;
  endEdge: number;
  endMiddle: number;
  endTotal: number;
  allEdge: number;
  allMiddle: number;
  allTotal: number;
}

export interface UnifiedBuildingLayoutInput {
  mainFrameAxisCount: number;
  crossSpanCount: number;
  extraFrameAxisCount?: number;
}

export interface UnifiedBuildingLayout {
  frames: UnifiedFrameLayout;
  columns: UnifiedColumnCounts;
}

function finiteNonNegativeInteger(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function deriveUnifiedBuildingLayout(
  input: UnifiedBuildingLayoutInput,
): UnifiedBuildingLayout {
  const totalFrameAxes = finiteNonNegativeInteger(input.mainFrameAxisCount);
  const crossSpanCount = finiteNonNegativeInteger(input.crossSpanCount);
  const extraFrameAxes = finiteNonNegativeInteger(input.extraFrameAxisCount ?? 0);
  const endFrameAxes = totalFrameAxes >= 2 ? 2 : totalFrameAxes;
  const interiorFrameAxes = Math.max(totalFrameAxes - endFrameAxes, 0);
  const edgePerFrame = crossSpanCount > 0 ? 2 : 0;
  const middlePerFrame = Math.max(crossSpanCount - 1, 0);
  const totalPerFrame = edgePerFrame + middlePerFrame;

  return {
    frames: {
      totalFrameAxes,
      interiorFrameAxes,
      endFrameAxes,
      frameBays: Math.max(totalFrameAxes - 1, 0),
      extraFrameAxes,
    },
    columns: {
      edgePerFrame,
      middlePerFrame,
      totalPerFrame,
      interiorEdge: edgePerFrame * interiorFrameAxes,
      interiorMiddle: middlePerFrame * interiorFrameAxes,
      interiorTotal: totalPerFrame * interiorFrameAxes,
      endEdge: edgePerFrame * endFrameAxes,
      endMiddle: middlePerFrame * endFrameAxes,
      endTotal: totalPerFrame * endFrameAxes,
      allEdge: edgePerFrame * totalFrameAxes,
      allMiddle: middlePerFrame * totalFrameAxes,
      allTotal: totalPerFrame * totalFrameAxes,
    },
  };
}
