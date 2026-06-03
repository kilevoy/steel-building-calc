import type { ResultItem } from "./building/resultsContext";
import type { WindowRiegelResult } from "./calc/windowRiegel/types";

export function buildWindowRiegelResultItem(
  result: WindowRiegelResult | null,
  params?: {
    count?: number;
    priceC245_rubKg?: number;
    priceC345_rubKg?: number;
  },
): ResultItem | null {
  const top = result?.lowerAndUpperProfiles?.[0];
  if (!top || top.profile == null || top.weightKg == null) {
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

  return {
    profile: String(top.profile),
    steel,
    massPerPiece_kg: top.weightKg,
    count,
    note: params
      ? "количество задано расчетчиком"
      : "единичный подобранный ригель; количество по фасадам требуется задать отдельно",
    totalMass_kg: top.weightKg * count,
    cost_rub: top.weightKg * count * price,
  };
}
