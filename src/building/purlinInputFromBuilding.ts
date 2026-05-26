import { getCassetteHeightFilter } from "../calc/purlin/engine";
import type { PurlinInput } from "../calc/purlin/types";
import structuresJson from "../data/structures/structures.json";
import type { Building } from "./buildingContext";

interface StructureRow {
  id: string;
  kPa: number;
}

const STRUCTURES = structuresJson as StructureRow[];

function lookupStructure(id: string): StructureRow | undefined {
  return STRUCTURES.find((structure) => structure.id === id);
}

export function buildPurlinInputFromBuilding(building: Building): PurlinInput {
  const roof = lookupStructure(building.roofStructure);
  return {
    gamma_n: building.responsibilityCoeff,
    roofShape: building.roofShape,
    span_m: building.span_m,
    length_m: building.length_m,
    height_m: building.height_m,
    roofSlope_deg: building.roofSlope_deg,
    framePitch_m: building.framePitch_m,
    terrainType: building.terrainType,
    w0_kPa: building.w0_kPa,
    Sg_kPa: building.Sg_kPa,
    roofStructure: building.roofStructure,
    deckProfile: "С44-1000-0,7",
    roofLoad_kPa: roof?.kPa ?? 0.105,
    snowDrift: "none",
    drift_dropHeight_m: 4.5,
    drift_existingSize_m: 9.5,
    maxStep_mm: 1500,
    minStep_mm: 500,
    snowGuardPurlin: false,
    fencePurlin: false,
    tieInstallation: "none",
    braceStep_m: 3,
    maxUtilization: "default",
    cassetteHeightFilter_mm: getCassetteHeightFilter(building.roofStructure),
  };
}
