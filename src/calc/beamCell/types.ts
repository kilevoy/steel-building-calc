export type Steel = "C245" | "C345";
export type PriceKind = "channel" | "tube" | "ibeam";
export type SolutionStatus = "OK" | "NO_SOLUTION" | "SKIPPED";

export interface BeamProfile {
  profile: string;
  h: number;
  b: number;
  s: number;
  t: number;
  r: number;
  area: number;
  mass: number;
  ix: number;
  wx: number;
  sx: number;
  rx: number;
  iy: number;
  wy: number;
  ry: number;
  serial?: number;
  kind?: PriceKind;
  lateralRx?: number;
  lateralRy?: number;
}

export interface ColumnProfile {
  profile: string;
  material: Steel;
  excluded: boolean;
  kind: PriceKind;
  h: number | null;
  b: number | null;
  s: number | null;
  t: number | null;
  r: number | null;
  area: number;
  mass: number;
  ix: number | null;
  wx: number | null;
  sx: number | null;
  rx: number;
  iy: number | null;
  wy: number | null;
  ry: number;
  serial: number;
  alpha: number;
  betaInPlane: number;
  betaOutPlane: number;
}

export interface WorkbookReferenceData {
  sourceWorkbook: string;
  floorDeadLoads: readonly { name: string; load: number }[];
  secondaryBeamProfiles: readonly BeamProfile[];
  mainBeamProfiles: Record<Steel, readonly BeamProfile[]>;
  columnProfiles: Record<Steel, readonly ColumnProfile[]>;
  savedScenario: {
    inputs: Partial<CalculatorInputs>;
    expected: unknown;
  };
}

export interface Prices {
  channelC245: number;
  tubeC245: number;
  ibeamC245: number;
  channelC345: number;
  tubeC345: number;
  ibeamC345: number;
}

export interface CalculatorInputs {
  lengthAlongMain: number;
  widthAcrossMain: number;
  columnHeight: number;
  mainBeamSpan: number;
  mainBeamStep: number;
  floorType: string;
  floorLoadKgM2: number;
  structureType: string;
  maxSecondaryStepMode: string;
  maxSecondaryStepMm: number;
  acceptedSecondarySteel: Steel;
  acceptedMainSteel: Steel;
  acceptedColumnSteel: Steel;
  prices: Prices;
}

export interface MemberSolution {
  status: SolutionStatus;
  material: Steel;
  profile?: string;
  weightKg?: number;
  stepMm?: number;
  costRub?: number;
  utilization?: number;
  message?: string;
}

export interface CalculationResult {
  qSecondary?: number;
  qMain: number;
  secondary: Record<Steel, MemberSolution>;
  main: Record<Steel, MemberSolution>;
  columns: Record<Steel, MemberSolution>;
  accepted: {
    secondary: MemberSolution;
    main: MemberSolution;
    columns: MemberSolution;
  };
  totals: {
    withoutColumnsKg?: number;
    withoutColumnsCostRub?: number;
    withColumnsKg?: number;
    withColumnsCostRub?: number;
  };
  columnLoadKn?: number;
  warnings: string[];
}
