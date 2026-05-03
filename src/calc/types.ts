export type ColumnType = "edge" | "middle" | "fachwerk";
export type RoofType = "gable" | "single_slope";
export type TerrainType = "A" | "B" | "C";
export type SteelGrade = "С255Б" | "С355Б" | "С245" | "С345";
export type SpanCount = "single" | "multi";

export interface ProfileData {
  name: string;
  category: "beam_normal" | "beam_wide" | "beam_column" | "square_tube" | "rect_tube";
  h_mm: number | null;
  b_mm: number | null;
  s_mm: number | null;
  t_mm: number | null;
  R_mm: number | null;
  A_cm2: number;
  mass_kg_per_m: number;
  Ix_cm4: number;
  Wx_cm3: number;
  Sx_cm3: number | null;
  ix_cm: number;
  Iy_cm4: number;
  Wy_cm3: number;
  iy_cm: number;
}

export type CraneCapacity =
  | "5" | "8" | "10" | "12.5" | "16" | "16/3.2" | "20/5" | "32/5" | "50/12.5";

export interface OverheadCrane {
  enabled: boolean;
  capacity: CraneCapacity;
  /** Catalog span — must be one of {12, 18, 24, 30, 36}. */
  span_m: number;
  count: "one" | "two";
  singleSpan: boolean;
  railLevel_m: number;
  /** Auto-filled from catalog by (capacity, span). */
  wheelLoad_kN: number;
  /** Auto-filled. Crane base (between two crane wheels), m. */
  base_m: number;
  /** Auto-filled. Crane gauge / габарит (between rails), m. */
  gauge_m: number;
}

export interface SuspendedCrane {
  enabled: boolean;
  capacity_t: number;
  singleSpan: boolean;
}

export interface SteelPrices {
  "С255Б": number;
  "С355Б": number;
  "С245": number;
  "С345": number;
}

export interface CalculationInput {
  height_m: number;
  span_m: number;
  length_m: number;
  framePitch_m: number;
  fachverkPitch_m: number;
  roofSlope_deg: number;
  roofType: RoofType;
  spanCount: SpanCount;
  perimeterTies: boolean;
  columnType: ColumnType;
  responsibilityCoeff: number;
  terrainType: TerrainType;
  w0_kPa: number;
  Sg_kPa: number;
  /** Roof structure id from `structures.json` (autofills `roofLoad_kPa`). */
  roofStructure: string;
  roofLoad_kPa: number;
  /** Wall structure id from `structures.json` (autofills `wallLoad_kPa`). */
  wallStructure: string;
  wallLoad_kPa: number;
  loadAddition_pct: number;
  overheadCrane: OverheadCrane;
  suspendedCrane: SuspendedCrane;
  prices: SteelPrices;
}

export interface ProfileResult {
  rank: number;
  profileName: string;
  steel: SteelGrade;
  struts: number;
  Ry_MPa: number;
  utilizationSigma: number;
  utilizationStabX: number;
  utilizationStabY: number;
  utilizationSlendX: number;
  utilizationSlendY: number;
  maxUtilization: number;
  limitingCheck: string;
  mass_per_m: number;
  columnMass_kg: number;
  strutCount: number;
  totalMass_kg: number;
  cost_rub: number;
}

export interface CalculationOutput {
  N_kN: number;
  M_kNm: number;
  Q_kN: number;
  mu: number;
  snowLoad_kPa: number;
  windPressure_kPa: number;
  windSuction_kPa: number;
  tributaryArea_m2: number;
  wallArea_m2: number;
  results: ProfileResult[];
}
