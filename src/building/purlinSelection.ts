import type { RolledCandidate } from "../calc/purlin/rolled";
import type { PurlinCandidate, PurlinOutput } from "../calc/purlin/types";
import type { Building, PurlinSelectionMode } from "./buildingContext";
import type { ResultItem } from "./resultsContext";

export interface PurlinSelectionPrices {
  priceMP350_rubKg: number;
  priceMP390_rubKg: number;
  priceC245_rubKg: number;
  priceC345_rubKg: number;
}

const LSTK_MODE_LABELS: Record<Exclude<PurlinSelectionMode, "auto" | "rolled">, string> = {
  "2TPS": "2ТПС",
  "2PS": "2ПС",
  Z: "Z",
};

export function purlinSelectionModeLabel(mode: PurlinSelectionMode): string {
  if (mode === "auto") return "Авто";
  if (mode === "rolled") return "Прокатный черный металл";
  return LSTK_MODE_LABELS[mode];
}

export function getPurlinSelectionWarning(
  mode: PurlinSelectionMode,
  result: ResultItem | null,
): string | null {
  if (result) return null;

  return `Выбранный тип прогонов «${purlinSelectionModeLabel(mode)}» не дал подходящего кандидата. Проверьте вкладку «Прогоны» и причины отсева.`;
}

export function getAvailablePurlinSelectionModes(building: Building): PurlinSelectionMode[] {
  const modes: PurlinSelectionMode[] = ["auto"];
  if (building.roofStructure.startsWith("наше ")) {
    modes.push("2TPS");
  }
  return [...modes, "2PS", "Z", "rolled"];
}

function priceForLstk(candidate: PurlinCandidate, prices: PurlinSelectionPrices): number {
  return candidate.profile.Ry_MPa >= 380 ? prices.priceMP390_rubKg : prices.priceMP350_rubKg;
}

function priceForRolled(candidate: RolledCandidate, prices: PurlinSelectionPrices): number {
  return candidate.steel === "С345" ? prices.priceC345_rubKg : prices.priceC245_rubKg;
}

function resultFromLstkCandidate(candidate: PurlinCandidate, prices: PurlinSelectionPrices): ResultItem {
  const steel = candidate.profile.Ry_MPa >= 380 ? "МП390" : "МП350";
  const pricePerKg = priceForLstk(candidate, prices);

  return {
    profile: candidate.profile.name,
    steel,
    totalMass_kg: candidate.massPerBuilding_kg,
    cost_rub: candidate.massPerBuilding_kg * pricePerKg,
  };
}

function resultFromRolledCandidate(candidate: RolledCandidate, prices: PurlinSelectionPrices): ResultItem {
  const pricePerKg = priceForRolled(candidate, prices);

  return {
    profile: candidate.profile.name,
    steel: candidate.steel,
    totalMass_kg: candidate.massPerBuilding_kg,
    cost_rub: candidate.massPerBuilding_kg * pricePerKg,
  };
}

function selectLstkCandidate(output: PurlinOutput | null, mode: PurlinSelectionMode): PurlinCandidate | null {
  if (!output) return null;
  if (mode === "auto") {
    return output.top10[0] ?? null;
  }
  if (mode === "rolled") {
    return null;
  }

  const candidates = output.sections
    .filter((section) => section.type === mode)
    .map((section) => section.best)
    .filter((candidate): candidate is PurlinCandidate => candidate !== null);

  candidates.sort((a, b) => a.massPerBuilding_kg - b.massPerBuilding_kg);
  return candidates[0] ?? null;
}

export function buildSelectedPurlinResultItem(
  output: PurlinOutput | null,
  rolledTop10: RolledCandidate[],
  selectionMode: PurlinSelectionMode,
  prices: PurlinSelectionPrices,
): ResultItem | null {
  if (selectionMode === "rolled") {
    const candidate = rolledTop10[0];
    return candidate ? resultFromRolledCandidate(candidate, prices) : null;
  }

  const candidate = selectLstkCandidate(output, selectionMode);
  return candidate ? resultFromLstkCandidate(candidate, prices) : null;
}
