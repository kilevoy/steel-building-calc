import { createContext } from "react";
import type { OverheadCrane, SpanCount, SuspendedCrane } from "../calc/types";
import type { TerrainType } from "../types/common";

export type RoofShape = "gable" | "monoslope";
export type FrameLayoutMode = "uniform" | "central_with_end_bays";
export type PurlinSelectionMode = "auto" | "2TPS" | "2PS" | "Z" | "rolled";
export type PurlinContinuityScheme = "split" | "continuous";

export interface Building {
  span_m: number;
  length_m: number;
  height_m: number;
  roofSlope_deg: number;
  framePitch_m: number;
  frameLayoutMode: FrameLayoutMode;
  centralBayCount: number;
  w0_kPa: number;
  Sg_kPa: number;
  terrainType: TerrainType;
  roofStructure: string;
  wallStructure: string;
  roofShape: RoofShape;
  spanCount: SpanCount;
  hasCrane: boolean;
  /** Полная конфигурация кранов — общая для всех вкладок, переживает переключение между ними. */
  overheadCrane: OverheadCrane;
  suspendedCrane: SuspendedCrane;
  city: string;
  responsibilityCoeff: number;
  priceC255B_rubKg: number;
  priceC355B_rubKg: number;
  priceC245_rubKg: number;
  priceC345_rubKg: number;
  priceMP350_rubKg: number;
  priceMP390_rubKg: number;
  purlinSelectionMode: PurlinSelectionMode;
  purlinContinuityScheme: PurlinContinuityScheme;
  windowRiegelCount: number;
  /** Расчётная сейсмичность площадки, баллы MSK-64 (6 = несейсмический район). */
  seismicPoints: number;
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
  frameLayoutMode: "uniform",
  centralBayCount: 5,
  w0_kPa: 0.38,
  Sg_kPa: 2.45,
  terrainType: "B",
  roofStructure: "профлист",
  wallStructure: "профлист",
  roofShape: "gable",
  spanCount: "single",
  hasCrane: false,
  overheadCrane: {
    enabled: false,
    capacity: "5",
    span_m: 12,
    count: "one",
    singleSpan: true,
    railLevel_m: 3.5,
    wheelLoad_kN: 50,
    base_m: 3.7,
    gauge_m: 4.7,
  },
  suspendedCrane: {
    enabled: false,
    capacity_t: 2,
    singleSpan: true,
  },
  city: "",
  responsibilityCoeff: 1,
  priceC255B_rubKg: 148.8,
  priceC355B_rubKg: 155.88,
  priceC245_rubKg: 130.2,
  priceC345_rubKg: 141,
  priceMP350_rubKg: 180,
  priceMP390_rubKg: 180,
  purlinSelectionMode: "auto",
  purlinContinuityScheme: "split",
  windowRiegelCount: 1,
  seismicPoints: 6,
};

export const BuildingContext = createContext<BuildingContextValue | null>(null);
