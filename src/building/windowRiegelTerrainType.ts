import type { Building } from "./buildingContext";

// The workbook-backed window-riegel engine expects Cyrillic terrain labels.
export function toWindowRiegelTerrainType(
  value: Building["terrainType"],
): "А" | "В" | "С" {
  if (value === "A") return "А";
  if (value === "B") return "В";
  return "С";
}
