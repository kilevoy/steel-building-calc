import { runPurlinCalculation } from "../calc/purlin/engine";
import { selectRolledTop10 } from "../calc/purlin/rolled";
import type { Building } from "./buildingContext";
import type { BuildingResults, ResultItem } from "./resultsContext";
import { buildPurlinInputFromBuilding } from "./purlinInputFromBuilding";
import { buildSelectedPurlinResultItem } from "./purlinSelection";

export function calculateAutoPurlinResult(building: Building): ResultItem | null {
  const input = buildPurlinInputFromBuilding(building);
  const output = runPurlinCalculation(input);
  const cosA = Math.cos((input.roofSlope_deg * Math.PI) / 180);
  const q_SLS_kPa =
    0.5 * 1.1 * input.Sg_kPa * cosA * input.gamma_n + (input.roofLoad_kPa / 1.2) * input.gamma_n;
  const rolledTop10 = selectRolledTop10(
    {
      ...input,
      minStep_mm: 1500,
      maxStep_mm: 1500,
      rolledMaxK: 0.8,
      rolledPrices: {
        beam_C255B: building.priceC255B_rubKg,
        beam_C355B: building.priceC355B_rubKg,
        tube_C245: building.priceC245_rubKg,
        tube_C345: building.priceC345_rubKg,
        channel_C245: building.priceC245_rubKg,
        channel_C345: building.priceC345_rubKg,
      },
    },
    output.q_total_kPa,
    q_SLS_kPa,
  );

  return buildSelectedPurlinResultItem(output, rolledTop10, building.purlinSelectionMode, {
    priceMP350_rubKg: building.priceMP350_rubKg,
    priceMP390_rubKg: building.priceMP390_rubKg,
    priceC245_rubKg: building.priceC245_rubKg,
    priceC345_rubKg: building.priceC345_rubKg,
  });
}

export function applyAutoPurlinResult(
  results: BuildingResults,
  building: Building,
): BuildingResults {
  if (results.purlin) {
    return results;
  }
  return {
    ...results,
    purlin: calculateAutoPurlinResult(building),
  };
}
