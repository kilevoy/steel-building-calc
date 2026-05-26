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

export function purlinContinuitySchemeLabel(scheme: Building["purlinContinuityScheme"]): string {
  return scheme === "split" ? "Разрезной" : "Неразрезной";
}

export function getPurlinSelectionWarning(
  mode: PurlinSelectionMode,
  building: Building,
  result: ResultItem | null,
): string | null {
  if (!getAvailablePurlinSelectionModes(building).includes(mode)) {
    return `Выбранный тип прогонов «${purlinSelectionModeLabel(mode)}» недоступен для текущей конструкции покрытия. Проверьте вкладку «Прогоны» или выберите другой тип.`;
  }

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

function estimatePurlinLineCount(building: Building, spacing_mm: number): number {
  const slopeFactor = building.roofShape === "gable" ? 2 : 1;
  const slopeLength_m = (building.span_m - 0.3) / slopeFactor;
  const baseCountPerSlope = Math.ceil(slopeLength_m / (spacing_mm / 1000)) + 1;
  return baseCountPerSlope * slopeFactor;
}

function purlinQuantityFields(
  candidate: { nPurlins?: number; spacing_mm: number },
  building: Building,
) {
  const lineCount = Math.max(
    1,
    Math.round(candidate.nPurlins ?? estimatePurlinLineCount(building, candidate.spacing_mm)),
  );
  const bayCount = Math.max(1, Math.ceil(building.length_m / building.framePitch_m));
  const count = building.purlinContinuityScheme === "split" ? lineCount * bayCount : lineCount;
  const lengthPerPiece_m =
    building.purlinContinuityScheme === "split" ? building.framePitch_m : building.length_m;

  return {
    count,
    lengthPerPiece_m,
    totalLength_m: count * lengthPerPiece_m,
    note: `${purlinContinuitySchemeLabel(building.purlinContinuityScheme)}, шаг ${candidate.spacing_mm} мм`,
  };
}

function resultFromLstkCandidate(
  candidate: PurlinCandidate,
  building: Building,
  prices: PurlinSelectionPrices,
): ResultItem {
  const steel = candidate.profile.Ry_MPa >= 380 ? "МП390" : "МП350";
  const pricePerKg = priceForLstk(candidate, prices);

  return {
    profile: candidate.profile.name,
    steel,
    ...purlinQuantityFields(candidate, building),
    totalMass_kg: candidate.massPerBuilding_kg,
    cost_rub: candidate.massPerBuilding_kg * pricePerKg,
  };
}

function resultFromRolledCandidate(
  candidate: RolledCandidate,
  building: Building,
  prices: PurlinSelectionPrices,
): ResultItem {
  const pricePerKg = priceForRolled(candidate, prices);

  return {
    profile: candidate.profile.name,
    steel: candidate.steel,
    ...purlinQuantityFields({ spacing_mm: candidate.spacing_mm }, building),
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
  building: Building,
  selectionMode: PurlinSelectionMode,
  prices: PurlinSelectionPrices,
): ResultItem | null {
  if (selectionMode === "rolled") {
    const candidate = rolledTop10[0];
    return candidate ? resultFromRolledCandidate(candidate, building, prices) : null;
  }

  const candidate = selectLstkCandidate(output, selectionMode);
  return candidate ? resultFromLstkCandidate(candidate, building, prices) : null;
}
