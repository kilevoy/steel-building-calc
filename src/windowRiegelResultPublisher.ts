import type { ResultItem } from "./building/resultsContext";
import type { WindowRiegelResult } from "./calc/windowRiegel/types";
import { getUsableWindowRiegelOptions } from "./windowRiegelOptionVisibility";

export function buildWindowRiegelResultItem(
  result: WindowRiegelResult | null,
  params?: {
    count?: number;
    priceC245_rubKg?: number;
    priceC345_rubKg?: number;
  },
): ResultItem | null {
  if (!result) {
    return null;
  }

  const top = getUsableWindowRiegelOptions(result.lowerAndUpperProfiles)[0];
  if (!top) {
    return null;
  }

  const count =
    params?.count == null || !Number.isFinite(params.count)
      ? 1
      : Math.max(1, Math.floor(params.count));
  const steel = top.steel ? String(top.steel) : "—";
  const price = steel.includes("245")
    ? (params?.priceC245_rubKg ?? 0)
    : steel.includes("345")
      ? (params?.priceC345_rubKg ?? 0)
      : 0;
  const lengthPerPiece_m =
    result.outOfPlaneLengthM != null && Number.isFinite(result.outOfPlaneLengthM)
      ? result.outOfPlaneLengthM
      : undefined;
  const inPlaneLengthText =
    result.inPlaneLengthM != null && Number.isFinite(result.inPlaneLengthM)
      ? `; в плоскости ${result.inPlaneLengthM.toFixed(2)} м`
      : "";
  const lengthDetails = lengthPerPiece_m == null
    ? ""
    : `; длина из плоскости ${lengthPerPiece_m.toFixed(2)} м${inPlaneLengthText}`;

  return {
    profile: String(top.profile),
    steel,
    massPerPiece_kg: top.weightKg,
    count,
    lengthPerPiece_m,
    totalLength_m: lengthPerPiece_m == null ? undefined : lengthPerPiece_m * count,
    note: params
      ? `количество задано расчетчиком${lengthDetails}`
      : `единичный подобранный ригель; количество по фасадам требуется задать отдельно${lengthDetails}`,
    totalMass_kg: top.weightKg * count,
    cost_rub: top.weightKg * count * price,
  };
}
