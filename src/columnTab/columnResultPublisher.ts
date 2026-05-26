import { deriveColumnLayout } from "../building/layout";
import type { ColumnResultByType, ResultItem } from "../building/resultsContext";
import type { CalculationInput, CalculationOutput, ColumnType } from "../calc/types";

const STRUT_MASS_KG_PER_M = 9.6;

type ResultsByColumnType = Record<ColumnType, CalculationOutput>;

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
      result.strutCount * STRUT_MASS_KG_PER_M * strutStep * 1.15;
    const totalMass_kg =
      result.mass_per_m * group.totalHeight_m + strutMassPerPiece_kg * group.count;

    return {
      profile: result.profileName,
      steel: result.steel,
      massPerPiece_kg: totalMass_kg / group.count,
      count: group.count,
      lengthPerPiece_m: group.totalHeight_m / group.count,
      totalLength_m: group.totalHeight_m,
      totalMass_kg,
      cost_rub: totalMass_kg * input.prices[result.steel],
    };
  };

  return {
    edge: buildItem("edge"),
    middle: buildItem("middle"),
    fachwerk: buildItem("fachwerk"),
  };
}
