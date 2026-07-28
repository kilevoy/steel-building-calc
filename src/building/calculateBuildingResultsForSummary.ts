import { calculate as calculateBeamCell, defaultInputs as defaultBeamCellInputs } from "../calc/beamCell/engine";
import { runCalculation } from "../calc/engine";
import { runTrussCalculation, getDefaultMinThickness } from "../calc/truss/engine";
import type { TrussInput } from "../calc/truss/types";
import {
  calculateWindowRiegel,
  defaultWindowRiegelInputs,
} from "../calc/windowRiegel/engine";
import { DEFAULT_COLUMN_INPUT } from "../defaults/columnInput";
import { buildBeamCellResultItem } from "../beamCellResultPublisher";
import { buildColumnResultPayload } from "../columnTab/columnResultPublisher";
import { buildTrussResultPayload } from "../trussResultPublisher";
import { buildWindowRiegelResultItem } from "../windowRiegelResultPublisher";
import type { CalculationInput, ColumnType } from "../calc/types";
import type { Building } from "./buildingContext";
import { calculateAutoPurlinResult } from "./autoPurlinResult";
import { toWindowRiegelTerrainType } from "./windowRiegelTerrainType";
import {
  calculateRoofTotalLoad_kPa,
  type RoofLoadBreakdown,
} from "./loadPropagation";
import { deriveColumnLayout, deriveEndRoofBeamLayout } from "./layout";
import type { BuildingResults } from "./resultsContext";
const COLUMN_TYPES: ColumnType[] = ["edge", "fachwerk", "middle"];

export interface BuildingSummaryCalculation {
  results: BuildingResults;
  errors: string[];
  roofLoad: RoofLoadBreakdown;
}

function columnInputFromBuilding(
  building: Building,
  roofLoad_kPa: number,
): CalculationInput {
  return {
    ...DEFAULT_COLUMN_INPUT,
    span_m: building.span_m,
    length_m: building.length_m,
    height_m: building.height_m,
    roofSlope_deg: building.roofSlope_deg,
    framePitch_m: building.framePitch_m,
    fachverkPitch_m: building.framePitch_m,
    spanCount: building.spanCount,
    w0_kPa: building.w0_kPa,
    Sg_kPa: building.Sg_kPa,
    terrainType: building.terrainType,
    roofStructure: building.roofStructure,
    roofType: building.roofShape === "gable" ? "gable" : "single_slope",
    roofLoad_kPa,
    responsibilityCoeff: building.responsibilityCoeff,
    prices: {
      "С255Б": building.priceC255B_rubKg,
      "С355Б": building.priceC355B_rubKg,
      "С245": building.priceC245_rubKg,
      "С345": building.priceC345_rubKg,
    },
  };
}

function trussInputFromBuilding(
  building: Building,
  roofLoad_kPa: number,
): TrussInput {
  return {
    height_m: building.height_m,
    span_m: building.span_m,
    length_m: building.length_m,
    framePitch_m: building.framePitch_m,
    purlinPitch_mm: 0,
    roofSlope_deg: building.roofSlope_deg,
    responsibilityCoeff: building.responsibilityCoeff,
    terrainType: building.terrainType,
    w0_kPa: building.w0_kPa,
    Sg_kPa: building.Sg_kPa,
    roofStructure: building.roofStructure,
    roofLoad_kPa,
    loadAddition_pct: 15,
    maxUtilization: 0.85,
    minThickness_mm: getDefaultMinThickness(),
    maxWidth_mm: { VP: 500, NP: 500 },
    minWidth_mm: { ORb: 80, OR: 80, RR: 60 },
  };
}

export function calculateBuildingResultsForSummary(
  building: Building,
): BuildingSummaryCalculation {
  const errors: string[] = [];
  const results: BuildingResults = {
    column: null,
    truss: null,
    purlin: null,
    beamCell: null,
    windowRiegel: null,
    craneBeam: null,
  };

  try {
    results.purlin = calculateAutoPurlinResult(building);
  } catch (error) {
    errors.push(`Прогоны: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const beamInput = {
      ...defaultBeamCellInputs,
      floorType: "балка покрытия" as const,
      mainBeamSpan: deriveEndRoofBeamLayout({
        span_m: building.span_m,
        roofSlope_deg: building.roofSlope_deg,
        roofShape: building.roofShape,
        spanCount: building.spanCount,
      }).lengthPerPiece_m,
      mainBeamStep: building.framePitch_m,
      prices: {
        ...defaultBeamCellInputs.prices,
        ibeamC245: building.priceC245_rubKg,
        ibeamC345: building.priceC345_rubKg,
      },
    };
    const beamResult = calculateBeamCell(beamInput);
    results.beamCell = buildBeamCellResultItem({
      solution: beamResult.main[beamInput.acceptedMainSteel],
      length_m: building.length_m,
      framePitch_m: building.framePitch_m,
      span_m: building.span_m,
      roofSlope_deg: building.roofSlope_deg,
      roofShape: building.roofShape,
      spanCount: building.spanCount,
    });
  } catch (error) {
    errors.push(`Балка покрытия: ${error instanceof Error ? error.message : String(error)}`);
  }

  const roofLoad = calculateRoofTotalLoad_kPa(building, {
    purlin: results.purlin,
    beamCell: results.beamCell,
  });

  try {
    const input = columnInputFromBuilding(building, roofLoad.total_kPa);
    const layout = deriveColumnLayout(input);
    const columnResults = Object.fromEntries(
      COLUMN_TYPES.map((columnType) => {
        const height_m = layout[columnType].maxHeight_m || input.height_m;
        return [columnType, runCalculation({ ...input, columnType, height_m })];
      }),
    ) as Record<ColumnType, ReturnType<typeof runCalculation>>;
    results.column = buildColumnResultPayload(input, columnResults);
  } catch (error) {
    errors.push(`Колонны: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const input = trussInputFromBuilding(building, roofLoad.total_kPa);
    const output = runTrussCalculation(input);
    results.truss = buildTrussResultPayload({
      input: {
        length_m: input.length_m,
        framePitch_m: input.framePitch_m,
        span_m: input.span_m,
      },
      output,
      spanCount: building.spanCount,
      priceC345_rubKg: building.priceC345_rubKg,
    });
  } catch (error) {
    errors.push(`Фермы: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const input = {
      ...defaultWindowRiegelInputs,
      buildingSpanM: building.span_m,
      buildingLengthM: building.length_m,
      buildingHeightM: building.height_m,
      frameStepM: building.framePitch_m,
      windLoadKpa: building.w0_kPa,
      city: building.city || defaultWindowRiegelInputs.city,
      terrainType: toWindowRiegelTerrainType(building.terrainType),
      responsibilityLevel: building.responsibilityCoeff,
    };
    results.windowRiegel = buildWindowRiegelResultItem(calculateWindowRiegel(input), {
      count: building.windowRiegelCount,
      priceC245_rubKg: building.priceC245_rubKg,
      priceC345_rubKg: building.priceC345_rubKg,
    });
  } catch (error) {
    errors.push(`Оконные ригели: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { results, errors, roofLoad };
}
