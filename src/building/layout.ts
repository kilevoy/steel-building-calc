import type { RoofType, SpanCount } from "../calc/types";

export interface FrameLayout {
  frameCount: number;
  interiorFrameCount: number;
}

export interface ColumnLayoutGroup {
  count: number;
  maxHeight_m: number;
  totalHeight_m: number;
}

export interface BuildingColumnLayout {
  edge: ColumnLayoutGroup;
  middle: ColumnLayoutGroup;
  fachwerk: ColumnLayoutGroup;
}

export interface RoofElementLayout {
  frameCount: number;
  interiorFrameCount: number;
  trussCount: number;
  endRoofBeamCount: number;
}

export function spanCountAsNumber(spanCount: SpanCount): number {
  return spanCount === "multi" ? 2 : 1;
}

export function deriveEndRoofBeamQuantity(spanCount: SpanCount): number {
  return 2 * spanCountAsNumber(spanCount);
}

export function deriveRoofElementLayout(params: {
  length_m: number;
  framePitch_m: number;
  spanCount: SpanCount;
}): RoofElementLayout {
  const frameLayout = deriveFrameLayout(params.length_m, params.framePitch_m);
  return {
    ...frameLayout,
    trussCount: frameLayout.interiorFrameCount,
    endRoofBeamCount: deriveEndRoofBeamQuantity(params.spanCount),
  };
}

export function deriveFrameLayout(length_m: number, framePitch_m: number): FrameLayout {
  const frameCount =
    Number.isFinite(length_m) && Number.isFinite(framePitch_m) && framePitch_m > 0
      ? Math.floor(length_m / framePitch_m) + 1
      : 0;
  return {
    frameCount,
    interiorFrameCount: Math.max(frameCount - 2, 0),
  };
}

export function positionsAcrossSpan(span_m: number, step_m: number): number[] {
  if (!Number.isFinite(span_m) || !Number.isFinite(step_m) || span_m <= 0 || step_m <= 0) {
    return [];
  }

  const positions: number[] = [];
  for (let x = 0; x < span_m; x += step_m) {
    positions.push(Number(x.toFixed(6)));
  }
  if (positions.length === 0 || positions[positions.length - 1] !== span_m) {
    positions.push(span_m);
  }
  return positions;
}

export function columnHeightAtX(params: {
  span_m: number;
  height_m: number;
  roofSlope_deg: number;
  roofType: RoofType;
  x_m: number;
}): number {
  const slopeRad = (params.roofSlope_deg * Math.PI) / 180;
  const x = Math.min(Math.max(params.x_m, 0), params.span_m);
  if (params.roofType === "single_slope") {
    return params.height_m + x * Math.tan(slopeRad);
  }
  return params.height_m + Math.min(x, params.span_m - x) * Math.tan(slopeRad);
}

function groupFromPositions(
  positions: number[],
  quantityPerPosition: number,
  heightAt: (x_m: number) => number,
): ColumnLayoutGroup {
  if (positions.length === 0 || quantityPerPosition <= 0) {
    return { count: 0, maxHeight_m: 0, totalHeight_m: 0 };
  }

  const heights = positions.map(heightAt);
  return {
    count: positions.length * quantityPerPosition,
    maxHeight_m: Math.max(...heights),
    totalHeight_m: heights.reduce((sum, height) => sum + height * quantityPerPosition, 0),
  };
}

export function deriveColumnLayout(params: {
  span_m: number;
  length_m: number;
  height_m: number;
  framePitch_m: number;
  fachverkPitch_m: number;
  roofSlope_deg: number;
  roofType: RoofType;
  spanCount: SpanCount;
}): BuildingColumnLayout {
  const { interiorFrameCount } = deriveFrameLayout(params.length_m, params.framePitch_m);
  const spanCount = spanCountAsNumber(params.spanCount);
  const heightAt = (x_m: number) =>
    columnHeightAtX({
      span_m: params.span_m,
      height_m: params.height_m,
      roofSlope_deg: params.roofSlope_deg,
      roofType: params.roofType,
      x_m,
    });

  const edge = groupFromPositions([0, params.span_m], interiorFrameCount, heightAt);
  const middlePositions =
    spanCount > 1
      ? Array.from({ length: spanCount - 1 }, (_, index) => (params.span_m / spanCount) * (index + 1))
      : [];
  const middle = groupFromPositions(middlePositions, interiorFrameCount, heightAt);
  const fachwerk = groupFromPositions(
    positionsAcrossSpan(params.span_m, params.fachverkPitch_m),
    2,
    heightAt,
  );

  return { edge, middle, fachwerk };
}
