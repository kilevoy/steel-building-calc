import { createContext } from "react";
import type { SpanCount } from "../calc/types";
import type { TerrainType } from "../types/common";

export type RoofShape = "gable" | "monoslope";

export interface Building {
  span_m: number;
  length_m: number;
  height_m: number;
  roofSlope_deg: number;
  framePitch_m: number;
  w0_kPa: number;
  Sg_kPa: number;
  terrainType: TerrainType;
  roofStructure: string;
  roofShape: RoofShape;
  spanCount: SpanCount;
  hasCrane: boolean;
  city: string;
  responsibilityCoeff: number;
  priceC255B_rubKg: number;
  priceC355B_rubKg: number;
  priceC245_rubKg: number;
  priceC345_rubKg: number;
  priceMP350_rubKg: number;
  priceMP390_rubKg: number;
}

export interface BuildingContextValue {
  building: Building;
  setBuilding: (patch: Partial<Building>) => void;
}

export const DEFAULT_BUILDING: Building = {
  span_m: 24,
  length_m: 72,
  height_m: 12,
  roofSlope_deg: 5,
  framePitch_m: 6,
  w0_kPa: 0.38,
  Sg_kPa: 2.45,
  terrainType: "B",
  roofStructure: "профлист",
  roofShape: "gable",
  spanCount: "single",
  hasCrane: false,
  city: "",
  responsibilityCoeff: 1,
  priceC255B_rubKg: 148.8,
  priceC355B_rubKg: 155.88,
  priceC245_rubKg: 130.2,
  priceC345_rubKg: 141,
  priceMP350_rubKg: 180,
  priceMP390_rubKg: 180,
};

export const BuildingContext = createContext<BuildingContextValue | null>(null);
