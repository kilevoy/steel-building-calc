import type { RoofShape } from "../../building/buildingContext";

export interface CladdingInput {
  span_m: number;
  length_m: number;
  eavesHeight_m: number;
  roofSlope_deg: number;
  roofShape: RoofShape;
  eavesOverhang_m: number;
  gableOverhang_m: number;
  wallOpenings_m2: number;
  roofOpenings_m2: number;
  reserve_percent: number;
}

export interface CladdingResult {
  roofRise_m: number;
  roofSlopeLength_m: number;
  roofGross_m2: number;
  longitudinalWallsGross_m2: number;
  endWallRectanglesGross_m2: number;
  upperEndWallsGross_m2: number;
  wallsGross_m2: number;
  roofNet_m2: number;
  wallsNet_m2: number;
  roofOrder_m2: number;
  wallsOrder_m2: number;
  totalGross_m2: number;
  totalNet_m2: number;
  totalOrder_m2: number;
}

const finitePositiveFields: Array<[keyof CladdingInput, string]> = [
  ["span_m", "Ширина здания"],
  ["length_m", "Длина здания"],
  ["eavesHeight_m", "Высота до карниза"],
];

const finiteNonNegativeFields: Array<[keyof CladdingInput, string]> = [
  ["roofSlope_deg", "Уклон кровли"],
  ["eavesOverhang_m", "Карнизный свес"],
  ["gableOverhang_m", "Торцевой свес"],
  ["wallOpenings_m2", "Проёмы в стенах"],
  ["roofOpenings_m2", "Проёмы в кровле"],
  ["reserve_percent", "Запас"],
];

export function validateCladdingInput(input: CladdingInput): string[] {
  const errors: string[] = [];
  for (const [key, label] of finitePositiveFields) {
    const value = input[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      errors.push(`${label}: значение должно быть больше 0.`);
    }
  }
  for (const [key, label] of finiteNonNegativeFields) {
    const value = input[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      errors.push(`${label}: значение не может быть отрицательным.`);
    }
  }
  if (input.roofSlope_deg >= 89) {
    errors.push("Уклон кровли должен быть меньше 89°.");
  }
  return errors;
}

export function calculateCladding(input: CladdingInput): CladdingResult {
  const errors = validateCladdingInput(input);
  if (errors.length > 0) {
    throw new RangeError(errors.join(" "));
  }

  const angleRad = (input.roofSlope_deg * Math.PI) / 180;
  const roofRise_m =
    (input.roofShape === "gable" ? input.span_m / 2 : input.span_m) * Math.tan(angleRad);
  const roofHorizontalProjection_m =
    (input.roofShape === "gable" ? input.span_m / 2 : input.span_m) +
    (input.roofShape === "gable" ? input.eavesOverhang_m : 2 * input.eavesOverhang_m);
  const roofSlopeLength_m = roofHorizontalProjection_m / Math.cos(angleRad);
  const roofLength_m = input.length_m + 2 * input.gableOverhang_m;
  const roofGross_m2 =
    roofSlopeLength_m * roofLength_m * (input.roofShape === "gable" ? 2 : 1);

  const longitudinalWallsGross_m2 =
    2 * input.length_m * input.eavesHeight_m +
    (input.roofShape === "monoslope" ? input.length_m * roofRise_m : 0);
  const endWallRectanglesGross_m2 = 2 * input.span_m * input.eavesHeight_m;
  // Для двускатной кровли это сумма двух фронтонов, для односкатной —
  // сумма двух треугольных участков над отметкой низкого карниза.
  const upperEndWallsGross_m2 = input.span_m * roofRise_m;
  const wallsGross_m2 =
    longitudinalWallsGross_m2 + endWallRectanglesGross_m2 + upperEndWallsGross_m2;

  if (input.wallOpenings_m2 > wallsGross_m2) {
    throw new RangeError("Площадь проёмов в стенах превышает площадь стен.");
  }
  if (input.roofOpenings_m2 > roofGross_m2) {
    throw new RangeError("Площадь проёмов в кровле превышает площадь кровли.");
  }

  const roofNet_m2 = roofGross_m2 - input.roofOpenings_m2;
  const wallsNet_m2 = wallsGross_m2 - input.wallOpenings_m2;
  const reserveFactor = 1 + input.reserve_percent / 100;
  const roofOrder_m2 = roofNet_m2 * reserveFactor;
  const wallsOrder_m2 = wallsNet_m2 * reserveFactor;

  return {
    roofRise_m,
    roofSlopeLength_m,
    roofGross_m2,
    longitudinalWallsGross_m2,
    endWallRectanglesGross_m2,
    upperEndWallsGross_m2,
    wallsGross_m2,
    roofNet_m2,
    wallsNet_m2,
    roofOrder_m2,
    wallsOrder_m2,
    totalGross_m2: roofGross_m2 + wallsGross_m2,
    totalNet_m2: roofNet_m2 + wallsNet_m2,
    totalOrder_m2: roofOrder_m2 + wallsOrder_m2,
  };
}
