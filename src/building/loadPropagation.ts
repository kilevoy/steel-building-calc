import type { Building } from "./buildingContext";
import type { BuildingResults } from "./resultsContext";
import { useBuilding } from "./useBuilding";
import { useBuildingResults } from "./useBuildingResults";
import structuresJson from "../data/structures/structures.json";

interface StructureRow {
  id: string;
  kPa: number;
}

const STRUCTURES = structuresJson as StructureRow[];

function structureKpa(id: string): number {
  return STRUCTURES.find((s) => s.id === id)?.kPa ?? 0;
}

export interface RoofLoadBreakdown {
  /** Roof panel/construction weight, kPa (from structures.json lookup). */
  structure_kPa: number;
  /** Purlins self-weight, kPa (purlin total mass / roof area x g). */
  purlin_kPa: number;
  /** Beam-cell self-weight, kPa. Mutually exclusive with purlins in normal use. */
  beamCell_kPa: number;
  /** Sum of structure + purlin + beamCell, kPa. */
  total_kPa: number;
}

export function calculateRoofTotalLoad_kPa(
  building: Pick<Building, "roofStructure" | "roofSlope_deg" | "span_m" | "length_m">,
  results: Pick<BuildingResults, "purlin" | "beamCell">,
): RoofLoadBreakdown {
  const structure = structureKpa(building.roofStructure);

  // Roof area with slope correction (1/cos).
  const slopeRad = (building.roofSlope_deg * Math.PI) / 180;
  const slopeFactor = 1 / Math.max(0.1, Math.cos(slopeRad));
  const roofArea_m2 = Math.max(1, building.span_m * building.length_m * slopeFactor);

  const G = 0.00981; // kPa per kg/m2 (gravity).

  const purlin_kPa = results.purlin
    ? (results.purlin.totalMass_kg / roofArea_m2) * G
    : 0;

  const beamCell_kPa = results.beamCell
    ? (results.beamCell.totalMass_kg / roofArea_m2) * G
    : 0;

  return {
    structure_kPa: structure,
    purlin_kPa,
    beamCell_kPa,
    total_kPa: structure + purlin_kPa + beamCell_kPa,
  };
}

/**
 * Computes the total dead load on the roof (kPa) including self-weight of
 * purlins / roof beam from the results bus.
 *
 * This is the shared roof load used by both the truss top chord and the
 * column tributary area, keeping truss reactions and column loads aligned.
 */
export function useRoofTotalLoad_kPa(): RoofLoadBreakdown {
  const { building } = useBuilding();
  const { results } = useBuildingResults();

  return calculateRoofTotalLoad_kPa(building, results);
}
