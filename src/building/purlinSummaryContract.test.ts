import { describe, expect, it } from "vitest";
import { runPurlinCalculation } from "../calc/purlin/engine";
import { DEFAULT_BUILDING } from "./buildingContext";
import type { BuildingResults } from "./resultsContext";
import { buildPurlinInputFromBuilding } from "./purlinInputFromBuilding";
import { buildSelectedPurlinResultItem } from "./purlinSelection";
import { buildSummaryRows } from "./summaryRows";
import { calculateBuildingSummaryTotals } from "./summaryTotals";

const prices = {
  priceMP350_rubKg: 180,
  priceMP390_rubKg: 180,
  priceC245_rubKg: 130.2,
  priceC345_rubKg: 141,
};

function emptyResults(purlin: BuildingResults["purlin"]): BuildingResults {
  return {
    column: null,
    truss: null,
    purlin,
    beamCell: null,
    windowRiegel: null,
    craneBeam: null,
  };
}

describe("purlin summary contract", () => {
  it("shows split and continuous purlin schemes with different piece lengths", () => {
    const output = runPurlinCalculation(buildPurlinInputFromBuilding(DEFAULT_BUILDING));
    const split = buildSelectedPurlinResultItem(output, [], {
      ...DEFAULT_BUILDING,
      purlinContinuityScheme: "split",
      purlinSelectionMode: "Z",
    }, "Z", prices);
    const continuous = buildSelectedPurlinResultItem(output, [], {
      ...DEFAULT_BUILDING,
      purlinContinuityScheme: "continuous",
      purlinSelectionMode: "Z",
    }, "Z", prices);

    const splitRow = buildSummaryRows(emptyResults(split))[0];
    const continuousRow = buildSummaryRows(emptyResults(continuous))[0];

    expect(splitRow).toMatchObject({
      label: "Прогоны (ЛСТК)",
      lengthPerPiece_m: "6.00 м",
    });
    expect(splitRow.details).toContain("Разрезной");
    expect(continuousRow).toMatchObject({
      label: "Прогоны (ЛСТК)",
      lengthPerPiece_m: "72.00 м",
    });
    expect(continuousRow.details).toContain("Неразрезной");
    expect(Number(splitRow.count)).toBeGreaterThan(Number(continuousRow.count));
    expect(split?.totalMass_kg).toBeCloseTo(continuous?.totalMass_kg ?? 0, 8);
    expect(calculateBuildingSummaryTotals(emptyResults(split))).toEqual({
      totalMass_kg: split?.totalMass_kg ?? 0,
      totalCost_rub: split?.cost_rub ?? 0,
    });
  });
});
