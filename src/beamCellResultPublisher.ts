import { deriveEndRoofBeamLayout } from "./building/layout";
import type { RoofShape } from "./building/buildingContext";
import type { ResultItem } from "./building/resultsContext";
import type { MemberSolution, Steel } from "./calc/beamCell/types";
import type { SpanCount } from "./calc/types";

export function buildBeamCellResultItem(params: {
  solution: MemberSolution | undefined;
  length_m: number;
  framePitch_m: number;
  span_m: number;
  roofSlope_deg: number;
  roofShape: RoofShape;
  spanCount: SpanCount;
}): ResultItem | null {
  const { solution } = params;
  if (!solution || solution.status !== "OK" || !solution.profile || solution.weightKg === undefined) {
    return null;
  }

  const layout = deriveEndRoofBeamLayout({
    span_m: params.span_m,
    roofSlope_deg: params.roofSlope_deg,
    roofShape: params.roofShape,
    spanCount: params.spanCount,
  });
  const steelLabel = steelLabelRu(solution.material);

  return {
    profile: solution.profile,
    steel: steelLabel,
    massPerPiece_kg: solution.weightKg,
    count: layout.count,
    lengthPerPiece_m: layout.lengthPerPiece_m,
    totalLength_m: layout.totalLength_m,
    totalMass_kg: solution.weightKg * layout.count,
    cost_rub: (solution.costRub ?? 0) * layout.count,
    note: params.roofShape === "gable" ? "торцы, 2 ската" : "торцы, 1 скат",
  };
}

function steelLabelRu(steel: Steel): string {
  return steel === "C245" ? "С245" : "С345";
}
