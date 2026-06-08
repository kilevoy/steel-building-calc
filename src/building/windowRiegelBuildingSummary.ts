import type { ResultItem } from "./resultsContext";

export interface WindowRiegelBuildingSummary {
  hasResult: boolean;
  count: number | null;
  massPerPiece_kg: number | null;
  totalMass_kg: number | null;
  details: string | null;
  message: string | null;
}

export function buildWindowRiegelBuildingSummary(
  windowRiegel: ResultItem | null,
): WindowRiegelBuildingSummary {
  if (!windowRiegel) {
    return {
      hasResult: false,
      count: null,
      massPerPiece_kg: null,
      totalMass_kg: null,
      details: null,
      message: "Итог по оконным ригелям появится после расчёта вкладки «Оконные ригели».",
    };
  }

  return {
    hasResult: true,
    count: windowRiegel.count ?? null,
    massPerPiece_kg: windowRiegel.massPerPiece_kg ?? null,
    totalMass_kg: windowRiegel.totalMass_kg,
    details: windowRiegel.details ?? windowRiegel.note ?? null,
    message: "Количество оконных ригелей задаётся расчётчиком по фасадам.",
  };
}
