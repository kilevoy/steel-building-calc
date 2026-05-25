import { deriveRoofElementLayout } from "./building/layout";
import type { ResultItem } from "./building/resultsContext";
import type { MemberSolution, Steel } from "./calc/beamCell/types";
import type { SpanCount } from "./calc/types";

export function buildBeamCellResultItem(params: {
  solution: MemberSolution | undefined;
  length_m: number;
  framePitch_m: number;
  spanCount: SpanCount;
}): ResultItem | null {
  const { solution } = params;
  if (!solution || solution.status !== "OK" || !solution.profile || solution.weightKg === undefined) {
    return null;
  }

  const count = deriveRoofElementLayout({
    length_m: params.length_m,
    framePitch_m: params.framePitch_m,
    spanCount: params.spanCount,
  }).endRoofBeamCount;
  const steelLabel = steelLabelRu(solution.material);

  return {
    profile: solution.profile,
    steel: steelLabel,
    massPerPiece_kg: solution.weightKg,
    count,
    totalMass_kg: solution.weightKg * count,
    cost_rub: (solution.costRub ?? 0) * count,
  };
}

function steelLabelRu(steel: Steel): string {
  return steel === "C245" ? "С245" : "С345";
}
