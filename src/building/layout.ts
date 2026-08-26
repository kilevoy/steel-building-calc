import type { RoofType, SpanCount } from "../calc/types";
import type { FrameLayoutMode, RoofShape } from "./buildingContext";

export interface FrameLayout {
  frameCount: number;
  interiorFrameCount: number;
}

export interface ColumnLayoutGroup {
  count: number;
  maxHeight_m: number;
  totalHeight_m: number;
}

export interface FrameAxisLayout extends FrameLayout {
  mode: FrameLayoutMode;
  axisPositions_m: number[];
  bayLengths_m: number[];
  endBayLength_m: number | null;
  validationError: string | null;
}

export interface ColumnLengthGroup {
  length_m: number;
  count: number;
  totalLength_m: number;
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

export interface EndRoofBeamLayout {
  count: number;
  lengthPerPiece_m: number;
  totalLength_m: number;
}

export function spanCountAsNumber(spanCount: SpanCount): number {
  return spanCount === "multi" ? 2 : 1;
}

export function deriveEndRoofBeamQuantity(spanCount: SpanCount): number {
  return 2 * spanCountAsNumber(spanCount);
}

export function deriveEndRoofBeamLayout(params: {
  span_m: number;
  roofSlope_deg: number;
  roofShape: RoofShape;
  spanCount: SpanCount;
}): EndRoofBeamLayout {
  const crossSpanCount = spanCountAsNumber(params.spanCount);
  const roofPlaneCount = params.roofShape === "gable" ? 2 : 1;
  const count = 2 * crossSpanCount * roofPlaneCount;
  const spanPerBay_m = crossSpanCount > 0 ? params.span_m / crossSpanCount : 0;
  const horizontalLength_m =
    params.roofShape === "gable" ? spanPerBay_m / 2 : spanPerBay_m;
  const cosSlope = Math.cos((params.roofSlope_deg * Math.PI) / 180);
  const lengthPerPiece_m =
    Number.isFinite(cosSlope) && cosSlope > 0
      ? horizontalLength_m / cosSlope
      : horizontalLength_m;

  return {
    count,
    lengthPerPiece_m,
    totalLength_m: count * lengthPerPiece_m,
  };
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

function rounded(value: number): number {
  return Number(value.toFixed(6));
}

export function deriveFrameAxisLayout(params: {
  length_m: number;
  framePitch_m: number;
  mode?: FrameLayoutMode;
  centralBayCount?: number;
}): FrameAxisLayout {
  const mode = params.mode ?? "uniform";
  const validBase =
    Number.isFinite(params.length_m) &&
    params.length_m > 0 &&
    Number.isFinite(params.framePitch_m) &&
    params.framePitch_m > 0;

  if (!validBase) {
    return {
      mode,
      frameCount: 0,
      interiorFrameCount: 0,
      axisPositions_m: [],
      bayLengths_m: [],
      endBayLength_m: null,
      validationError: "Длина здания и шаг рам должны быть больше 0.",
    };
  }

  if (mode === "uniform") {
    const frameCount = Math.floor(params.length_m / params.framePitch_m) + 1;
    const axisPositions_m = Array.from(
      { length: frameCount },
      (_, index) => rounded(index * params.framePitch_m),
    );
    const coveredLength_m = Math.max(frameCount - 1, 0) * params.framePitch_m;
    const uncoveredLength_m = rounded(params.length_m - coveredLength_m);
    return {
      mode,
      frameCount,
      interiorFrameCount: Math.max(frameCount - 2, 0),
      axisPositions_m,
      bayLengths_m: Array.from({ length: Math.max(frameCount - 1, 0) }, () => params.framePitch_m),
      endBayLength_m: null,
      validationError:
        Math.abs(uncoveredLength_m) <= 0.000001
          ? null
          : `Длина здания не делится на равномерный шаг рам: остаётся ${uncoveredLength_m} м. Выберите режим центральных пролётов и торцов.`,
    };
  }

  const centralBayCount = params.centralBayCount ?? 0;
  if (!Number.isInteger(centralBayCount) || centralBayCount < 1) {
    return {
      mode,
      frameCount: 0,
      interiorFrameCount: 0,
      axisPositions_m: [],
      bayLengths_m: [],
      endBayLength_m: null,
      validationError: "Количество центральных пролётов должно быть целым числом не меньше 1.",
    };
  }

  const remainingLength_m = params.length_m - centralBayCount * params.framePitch_m;
  const endBayLength_m = remainingLength_m / 2;
  if (!Number.isFinite(endBayLength_m) || endBayLength_m <= 0) {
    return {
      mode,
      frameCount: 0,
      interiorFrameCount: 0,
      axisPositions_m: [],
      bayLengths_m: [],
      endBayLength_m: rounded(endBayLength_m),
      validationError:
        "Длина здания должна быть больше суммарной длины центральных пролётов.",
    };
  }

  const bayLengths_m = [
    endBayLength_m,
    ...Array.from({ length: centralBayCount }, () => params.framePitch_m),
    endBayLength_m,
  ].map(rounded);
  const axisPositions_m = [0];
  for (const bayLength_m of bayLengths_m) {
    axisPositions_m.push(rounded(axisPositions_m[axisPositions_m.length - 1] + bayLength_m));
  }
  axisPositions_m[axisPositions_m.length - 1] = rounded(params.length_m);
  const frameCount = axisPositions_m.length;

  return {
    mode,
    frameCount,
    interiorFrameCount: Math.max(frameCount - 2, 0),
    axisPositions_m,
    bayLengths_m,
    endBayLength_m: rounded(endBayLength_m),
    validationError: null,
  };
}

export function groupColumnLengths(
  positions: number[],
  quantityPerPosition: number,
  heightAt: (x_m: number) => number,
): ColumnLengthGroup[] {
  if (positions.length === 0 || quantityPerPosition <= 0) {
    return [];
  }

  const groups = new Map<string, ColumnLengthGroup>();
  for (const position of positions) {
    const height = heightAt(position);
    const key = height.toFixed(6);
    const existing = groups.get(key);
    if (existing) {
      existing.count += quantityPerPosition;
      existing.totalLength_m += height * quantityPerPosition;
    } else {
      groups.set(key, {
        length_m: height,
        count: quantityPerPosition,
        totalLength_m: height * quantityPerPosition,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.length_m - b.length_m);
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
  frameAxisPositions_m?: readonly number[];
}): BuildingColumnLayout {
  const interiorFrameCount = params.frameAxisPositions_m
    ? Math.max(params.frameAxisPositions_m.length - 2, 0)
    : deriveFrameLayout(params.length_m, params.framePitch_m).interiorFrameCount;
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
