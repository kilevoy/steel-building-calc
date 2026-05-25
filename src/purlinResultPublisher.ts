import type { ResultItem } from "./building/useBuildingResults";
import type { PurlinOutput } from "./calc/purlin/types";

export interface PurlinResultPrices {
  priceMP350_rubKg: number;
  priceMP390_rubKg: number;
}

export function buildPurlinResultItem(
  output: PurlinOutput | null,
  prices: PurlinResultPrices,
): ResultItem | null {
  const top = output?.top10[0];
  if (!top) return null;

  const isMP390 = top.profile.Ry_MPa >= 380;
  const steel = isMP390 ? "МП390" : "МП350";
  const pricePerKg = isMP390 ? prices.priceMP390_rubKg : prices.priceMP350_rubKg;

  return {
    profile: top.profile.name,
    steel,
    totalMass_kg: top.massPerBuilding_kg,
    cost_rub: top.massPerBuilding_kg * pricePerKg,
  };
}
