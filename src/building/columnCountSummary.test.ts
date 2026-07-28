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
      acceptedFachwerk: 10,
      totalAccepted: 32,
      totalFormulaText: "32 = 22 основных + 10 фахверковых",
      excludedEndFachwerk: 0,
      mainCountMismatch: false,
    });
  });

  it("excludes end-fachwerk positions when crane mode counts end columns as main", () => {
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
      fachwerkPublished: 10,
      acceptedFachwerk: 6,
      excludedEndFachwerk: 4,
      totalAccepted: 32,
      totalFormulaText: "32 = 26 основных + 6 фахверковых",
      mainCountMismatch: true,
    });
  });

  it("does not subtract more fachwerk positions than the column tab published", () => {
    const summary = buildColumnCountSummary({
      ...DEFAULT_BUILDING,
      hasCrane: true,
    }, {
      ...emptyResults,
      column: {
        edge: item(22),
        middle: null,
        fachwerk: item(2),
      },
    });

    expect(summary).toMatchObject({
      acceptedFachwerk: 0,
      excludedEndFachwerk: 2,
      totalAccepted: 26,
      totalFormulaText: "26 = 26 основных + 0 фахверковых",
    });
  });
});
