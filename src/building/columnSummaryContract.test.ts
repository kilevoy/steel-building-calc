import { describe, expect, it } from "vitest";
import type { BuildingResults, ResultItem } from "./resultsContext";
import { buildSummaryRows } from "./summaryRows";
import { calculateBuildingSummaryTotals } from "./summaryTotals";

function columnItem(params: {
  count: number;
  lengthPerPiece_m: number;
  totalMass_kg: number;
  cost_rub: number;
}): ResultItem {
  return {
    profile: "35 Б1",
    steel: "С355Б",
    massPerPiece_kg: params.totalMass_kg / params.count,
    count: params.count,
    lengthPerPiece_m: params.lengthPerPiece_m,
    totalLength_m: params.count * params.lengthPerPiece_m,
    totalMass_kg: params.totalMass_kg,
    cost_rub: params.cost_rub,
  };
}

describe("column summary contract", () => {
  it("expands column length breakdown rows without losing aggregate totals", () => {
    const edgeShort = columnItem({
      count: 11,
      lengthPerPiece_m: 12,
      totalMass_kg: 11_000,
      cost_rub: 1_100_000,
    });
    const edgeTall = columnItem({
      count: 11,
      lengthPerPiece_m: 14.1,
      totalMass_kg: 13_000,
      cost_rub: 1_300_000,
    });
    const fachwerkEdge = columnItem({
      count: 4,
      lengthPerPiece_m: 12,
      totalMass_kg: 2_000,
      cost_rub: 200_000,
    });
    const fachwerkRidge = columnItem({
      count: 2,
      lengthPerPiece_m: 13.05,
      totalMass_kg: 1_300,
      cost_rub: 130_000,
    });
    const results: BuildingResults = {
      column: {
        edge: {
          ...columnItem({
            count: 22,
            lengthPerPiece_m: (edgeShort.totalLength_m! + edgeTall.totalLength_m!) / 22,
            totalMass_kg: edgeShort.totalMass_kg + edgeTall.totalMass_kg,
            cost_rub: edgeShort.cost_rub + edgeTall.cost_rub,
          }),
          breakdown: [edgeShort, edgeTall],
        },
        middle: null,
        fachwerk: {
          ...columnItem({
            count: 6,
            lengthPerPiece_m: (fachwerkEdge.totalLength_m! + fachwerkRidge.totalLength_m!) / 6,
            totalMass_kg: fachwerkEdge.totalMass_kg + fachwerkRidge.totalMass_kg,
            cost_rub: fachwerkEdge.cost_rub + fachwerkRidge.cost_rub,
          }),
          breakdown: [fachwerkEdge, fachwerkRidge],
        },
      },
      truss: null,
      purlin: null,
      beamCell: null,
      windowRiegel: null,
      craneBeam: null,
    };

    expect(buildSummaryRows(results)).toMatchObject([
      { label: "Колонна крайняя", count: "11", lengthPerPiece_m: "12.00 м" },
      { label: "Колонна крайняя", count: "11", lengthPerPiece_m: "14.10 м" },
      { label: "Колонна фахверк", count: "4", lengthPerPiece_m: "12.00 м" },
      { label: "Колонна фахверк", count: "2", lengthPerPiece_m: "13.05 м" },
    ]);
    expect(calculateBuildingSummaryTotals(results)).toEqual({
      totalMass_kg: 27_300,
      totalCost_rub: 2_730_000,
    });
  });
});
