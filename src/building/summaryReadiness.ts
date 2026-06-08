import type { Building } from "./buildingContext";
import type { BuildingResults } from "./resultsContext";

export interface SummaryReadinessItem {
  label: string;
  status: "ready" | "missing" | "not-required";
  message: string;
}

export function buildSummaryReadiness(
  building: Building,
  results: BuildingResults,
): SummaryReadinessItem[] {
  const hasColumns = !!(results.column?.edge || results.column?.middle || results.column?.fachwerk);

  return [
    {
      label: "Колонны",
      status: hasColumns ? "ready" : "missing",
      message: hasColumns ? "подбор опубликован" : "нужно рассчитать вкладку «Колонна»",
    },
    {
      label: "Фермы",
      status: results.truss ? "ready" : "missing",
      message: results.truss ? "подбор опубликован" : "нужно рассчитать вкладку «Ферма»",
    },
    {
      label: "Прогоны",
      status: results.purlin ? "ready" : "missing",
      message: results.purlin ? "подбор опубликован" : "нужно рассчитать вкладку «Прогоны» или выбрать авто-подбор",
    },
    {
      label: "Балка покрытия",
      status: results.beamCell ? "ready" : "missing",
      message: results.beamCell ? "подбор опубликован" : "нужно рассчитать вкладку «Балка покрытия»",
    },
    {
      label: "Оконные ригели",
      status: results.windowRiegel ? "ready" : "missing",
      message: results.windowRiegel ? "подбор опубликован, количество задано вручную" : "нужно рассчитать вкладку «Оконные ригели»",
    },
    {
      label: "Подкрановая балка",
      status: building.hasCrane ? (results.craneBeam ? "ready" : "missing") : "not-required",
      message: building.hasCrane
        ? (results.craneBeam ? "подбор опубликован" : "кран включён, нужен расчёт подкрановой балки")
        : "кран не включён",
    },
  ];
}

export function hasMissingRequiredSummaryItems(items: SummaryReadinessItem[]): boolean {
  return items.some((item) => item.status === "missing");
}
