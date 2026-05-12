export type TerrainType = "A" | "B" | "C";

export const TERRAIN_TYPES = ["A", "B", "C"] as const;

export function isTerrainType(value: unknown): value is TerrainType {
  return value === "A" || value === "B" || value === "C";
}
