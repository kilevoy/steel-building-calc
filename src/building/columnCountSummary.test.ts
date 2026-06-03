import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDING } from "./buildingContext";
import { buildColumnCountSummary } from "./columnCountSummary";
import type { BuildingResults, ResultItem } from "./resultsContext";

const emptyResults: BuildingResults = {
  column: null,
  truss: null,
  purlin: null,
  beamCell: null,
  windowRiegel: null,
  craneBeam: null,
};

function item(count: number): ResultItem {
  return {
    profile: "test",
    steel: "С345",
    count,
    totalMass_kg: 0,
    cost_rub: 0,
  };
}

describe("column count summary", () => {
  it("keeps totals empty until the column tab publishes a result", () => {
    const summary = buildColumnCountSummary(DEFAULT_BUILDING, emptyResults);

    expect(summary).toMatchObject({
      hasPublishedColumns: false,
      mainByGip: 22,
      publishedMain: null,
      fachwerkPublished: null,
      totalAccepted: null,
      totalFormulaText: null,
      mainCountMismatch: false,
    });
  });

  it("shows a matched no-crane scenario with fachwerk columns added to the total", () => {
    const summary = buildColumnCountSummary(DEFAULT_BUILDING, {
      ...emptyResults,
      column: {
        edge: item(22),
        middle: null,
        fachwerk: item(10),
      },
    });

    expect(summary).toMatchObject({
      hasPublishedColumns: true,
      mainByGip: 22,
      publishedMain: 22,
      fachwerkPublished: 10,
      totalAccepted: 32,
      totalFormulaText: "32 = 22 основных + 10 фахверковых",
      mainCountMismatch: false,
    });
  });

  it("warns when crane mode expects end columns in the main frame group", () => {
    const summary = buildColumnCountSummary({
      ...DEFAULT_BUILDING,
      hasCrane: true,
    }, {
      ...emptyResults,
      column: {
        edge: item(22),
        middle: null,
        fachwerk: item(10),
      },
    });

    expect(summary).toMatchObject({
      hasCrane: true,
      mainByGip: 26,
      publishedMain: 22,
      totalAccepted: 36,
      totalFormulaText: "36 = 26 основных + 10 фахверковых",
      mainCountMismatch: true,
    });
  });
});
