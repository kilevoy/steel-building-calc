import {
  columnHeightAtX,
  deriveColumnLayout,
  deriveFrameLayout,
  groupColumnLengths,
  spanCountAsNumber,
  positionsAcrossSpan,
} from "../building/layout";
import type { ColumnResultByType, ResultItem } from "../building/resultsContext";
import type { CalculationInput, CalculationOutput, ColumnType } from "../calc/types";
import {
  COLUMN_STRUT_ALLOWANCE,
  COLUMN_STRUT_MASS_KG_PER_M,
  COLUMN_STRUT_STEEL,
} from "./columnStruts";

type ResultsByColumnType = Record<ColumnType, CalculationOutput>;

function columnPositions(input: CalculationInput, columnType: ColumnType): {
  positions: number[];
  quantityPerPosition: number;
} {
  if (columnType === "edge") {
    return {
      positions: [0, input.span_m],
      quantityPerPosition: deriveFrameLayout(input.length_m, input.framePitch_m).interiorFrameCount,
    };
  }

  if (columnType === "middle") {
    const spanCount = spanCountAsNumber(input.spanCount);
    return {
      positions:
        spanCount > 1
          ? Array.from({ length: spanCount - 1 }, (_, index) => (input.span_m / spanCount) * (index + 1))
          : [],
      quantityPerPosition: deriveFrameLayout(input.length_m, input.framePitch_m).interiorFrameCount,
    };
  }

  return {
    positions: positionsAcrossSpan(input.span_m, input.fachverkPitch_m),
    quantityPerPosition: 2,
  };
}

function buildColumnLengthBreakdown(
  input: CalculationInput,
  columnType: ColumnType,
  result: CalculationOutput["results"][number],
  strutMassPerPiece_kg: number,
): ResultItem[] {
  const { positions, quantityPerPosition } = columnPositions(input, columnType);
  const groups = groupColumnLengths(
    positions,
    quantityPerPosition,
    (x_m) =>
      columnHeightAtX({
        span_m: input.span_m,
        height_m: input.height_m,
        roofSlope_deg: input.roofSlope_deg,
        roofType: input.roofType,
        x_m,
      }),
  );

  return groups.map((group) => {
    const strutMass_kg = strutMassPerPiece_kg * group.count;
    const columnMass_kg = result.mass_per_m * group.totalLength_m;
    const totalMass_kg =
      columnMass_kg + strutMass_kg;

    return {
      profile: result.profileName,
      steel: result.steel,
      massPerPiece_kg: totalMass_kg / group.count,
      count: group.count,
      lengthPerPiece_m: group.length_m,
      totalLength_m: group.totalLength_m,
      totalMass_kg,
      cost_rub:
        columnMass_kg * input.prices[result.steel] +
        strutMass_kg * input.prices[COLUMN_STRUT_STEEL],
      note: `распорок на колонну: ${result.strutCount}`,
    };
  });
}

export function buildColumnResultPayload(
  input: CalculationInput,
  results: ResultsByColumnType,
): ColumnResultByType {
  const layout = deriveColumnLayout(input);

  const buildItem = (columnType: ColumnType): ResultItem | null => {
    const group = layout[columnType];
    if (group.count === 0) return null;

    const result = results[columnType].results[0];
    if (!result) return null;

    const strutStep = columnType === "fachwerk" ? input.fachverkPitch_m : input.framePitch_m;
    const strutMassPerPiece_kg =
      result.strutCount * COLUMN_STRUT_MASS_KG_PER_M * strutStep * COLUMN_STRUT_ALLOWANCE;
    const strutMass_kg = strutMassPerPiece_kg * group.count;
    const columnMass_kg = result.mass_per_m * group.totalHeight_m;
    const totalMass_kg = columnMass_kg + strutMass_kg;

    const item: ResultItem = {
      profile: result.profileName,
      steel: result.steel,
      massPerPiece_kg: totalMass_kg / group.count,
      count: group.count,
      lengthPerPiece_m: group.totalHeight_m / group.count,
      totalLength_m: group.totalHeight_m,
      totalMass_kg,
      cost_rub:
        columnMass_kg * input.prices[result.steel] +
        strutMass_kg * input.prices[COLUMN_STRUT_STEEL],
      note: `распорок на колонну: ${result.strutCount}`,
    };

    item.breakdown = buildColumnLengthBreakdown(input, columnType, result, strutMassPerPiece_kg);

    return item;
  };

  return {
    edge: buildItem("edge"),
    middle: buildItem("middle"),
    fachwerk: buildItem("fachwerk"),
  };
}
