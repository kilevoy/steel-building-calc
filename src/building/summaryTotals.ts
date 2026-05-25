import type { BuildingResults, ResultItem } from "./resultsContext";

export interface SummaryTotals {
  totalMass_kg: number;
  totalCost_rub: number;
}

export interface SteelSummaryTotal extends SummaryTotals {
  steel: string;
}

function addItem(total: SummaryTotals, item: ResultItem | null): void {
  if (!item) return;
  total.totalMass_kg += item.totalMass_kg;
  total.totalCost_rub += item.cost_rub;
}

export function calculateBuildingSummaryTotals(results: BuildingResults): SummaryTotals {
  const total: SummaryTotals = {
    totalMass_kg: 0,
    totalCost_rub: 0,
  };

  if (results.column) {
    addItem(total, results.column.edge);
    addItem(total, results.column.middle);
    addItem(total, results.column.fachwerk);
  }

  if (results.truss) {
    total.totalMass_kg += results.truss.totalMass_kg;
    total.totalCost_rub += results.truss.totalCost_rub;
  }

  addItem(total, results.purlin);
  addItem(total, results.beamCell);
  addItem(total, results.windowRiegel);
  addItem(total, results.craneBeam);

  return total;
}

export function calculateBuildingSummaryTotalsBySteel(
  results: BuildingResults,
): SteelSummaryTotal[] {
  const totals = new Map<string, SteelSummaryTotal>();

  function addBySteel(item: ResultItem | null): void {
    if (!item || !item.steel) return;
    const current = totals.get(item.steel) ?? {
      steel: item.steel,
      totalMass_kg: 0,
      totalCost_rub: 0,
    };
    current.totalMass_kg += item.totalMass_kg;
    current.totalCost_rub += item.cost_rub;
    totals.set(item.steel, current);
  }

  if (results.column) {
    addBySteel(results.column.edge);
    addBySteel(results.column.middle);
    addBySteel(results.column.fachwerk);
  }

  addBySteel(results.purlin);
  addBySteel(results.beamCell);
  addBySteel(results.windowRiegel);
  addBySteel(results.craneBeam);

  if (results.truss) {
    const trussMassForCostSplit = results.truss.sections.reduce(
      (sum, section) => sum + section.totalMass_kg,
      0,
    );
    for (const section of results.truss.sections) {
      const current = totals.get(section.steel) ?? {
        steel: section.steel,
        totalMass_kg: 0,
        totalCost_rub: 0,
      };
      current.totalMass_kg += section.totalMass_kg;
      if (trussMassForCostSplit > 0) {
        current.totalCost_rub +=
          (section.totalMass_kg / trussMassForCostSplit) * results.truss.totalCost_rub;
      }
      totals.set(section.steel, current);
    }
  }

  return Array.from(totals.values()).sort((a, b) => {
    const massDiff = b.totalMass_kg - a.totalMass_kg;
    if (massDiff !== 0) return massDiff;
    return a.steel.localeCompare(b.steel);
  });
}
