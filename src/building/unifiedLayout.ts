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
  hasCrane: boolean;
  interiorEdge: number;
  interiorMiddle: number;
  interiorTotal: number;
  endEdge: number;
  endMiddle: number;
  endTotal: number;
  allEdge: number;
  allMiddle: number;
  allTotal: number;
  mainEdge: number;
  mainMiddle: number;
  mainTotal: number;
  endFachwerkEdge: number;
  endFachwerkMiddle: number;
  endFachwerkTotal: number;
}

export interface UnifiedBuildingLayoutInput {
  mainFrameAxisCount: number;
  crossSpanCount: number;
  extraFrameAxisCount?: number;
  hasCrane?: boolean;
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
  const hasCrane = input.hasCrane === true;
  const interiorEdge = edgePerFrame * interiorFrameAxes;
  const interiorMiddle = middlePerFrame * interiorFrameAxes;
  const interiorTotal = totalPerFrame * interiorFrameAxes;
  const endEdge = edgePerFrame * endFrameAxes;
  const endMiddle = middlePerFrame * endFrameAxes;
  const endTotal = totalPerFrame * endFrameAxes;
  const allEdge = edgePerFrame * totalFrameAxes;
  const allMiddle = middlePerFrame * totalFrameAxes;
  const allTotal = totalPerFrame * totalFrameAxes;

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
      hasCrane,
      interiorEdge,
      interiorMiddle,
      interiorTotal,
      endEdge,
      endMiddle,
      endTotal,
      allEdge,
      allMiddle,
      allTotal,
      mainEdge: hasCrane ? allEdge : interiorEdge,
      mainMiddle: hasCrane ? allMiddle : interiorMiddle,
      mainTotal: hasCrane ? allTotal : interiorTotal,
      endFachwerkEdge: hasCrane ? 0 : endEdge,
      endFachwerkMiddle: hasCrane ? 0 : endMiddle,
      endFachwerkTotal: hasCrane ? 0 : endTotal,
    },
  };
}
