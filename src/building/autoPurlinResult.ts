import { runPurlinCalculation } from "../calc/purlin/engine";
import { buildPurlinResultItem } from "../purlinResultPublisher";
import type { Building } from "./buildingContext";
import type { BuildingResults, ResultItem } from "./resultsContext";
import { buildPurlinInputFromBuilding } from "./purlinInputFromBuilding";

export function calculateAutoPurlinResult(building: Building): ResultItem | null {
  const input = buildPurlinInputFromBuilding(building);
  const output = runPurlinCalculation(input);
  return buildPurlinResultItem(output, {
    priceMP350_rubKg: building.priceMP350_rubKg,
    priceMP390_rubKg: building.priceMP390_rubKg,
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
