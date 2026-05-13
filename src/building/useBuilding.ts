import { useContext } from "react";
import { BuildingContext, type BuildingContextValue } from "./buildingContext";

export type { Building, RoofShape } from "./buildingContext";

export function useBuilding(): BuildingContextValue {
  const ctx = useContext(BuildingContext);
  if (!ctx) throw new Error("useBuilding must be used inside <BuildingProvider>");
  return ctx;
}
