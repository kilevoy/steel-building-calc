import type { SettlementClimateData } from "../types/climate";

let settlementsPromise: Promise<readonly SettlementClimateData[]> | null = null;

async function loadSettlements(): Promise<readonly SettlementClimateData[]> {
  if (!settlementsPromise) {
    settlementsPromise = import("../data/regions/settlements-climate.json").then(
      (module) => module.default as readonly SettlementClimateData[],
    );
  }
  return settlementsPromise;
}

export async function searchSettlementsAsync(
  query: string,
): Promise<SettlementClimateData[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const settlements = await loadSettlements();
  return settlements
    .filter(
      (item) =>
        item.settlement.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q),
    )
    .slice(0, 50);
}

export async function getSettlementClimateByIdAsync(
  id: string,
): Promise<SettlementClimateData | undefined> {
  const target = id.trim().toLowerCase();
  if (!target) return undefined;
  const settlements = await loadSettlements();
  return settlements.find((item) => item.id.toLowerCase() === target);
}

export async function getAllSettlementsAsync(): Promise<readonly SettlementClimateData[]> {
  return loadSettlements();
}
