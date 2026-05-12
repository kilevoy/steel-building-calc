export function validatePositiveNumber(value: number, fieldName: string): string | null {
  if (!Number.isFinite(value)) return `${fieldName}: значение должно быть числом.`;
  if (value <= 0) return `${fieldName}: значение должно быть больше 0.`;
  return null;
}

export function validateNonNegativeNumber(value: number, fieldName: string): string | null {
  if (!Number.isFinite(value)) return `${fieldName}: значение должно быть числом.`;
  if (value < 0) return `${fieldName}: значение не может быть отрицательным.`;
  return null;
}

export type ValidationKind = "positive" | "nonNegative";

export function validateNumberByKind(
  value: number,
  fieldName: string,
  kind?: ValidationKind,
): string | null {
  if (kind === "positive") return validatePositiveNumber(value, fieldName);
  if (kind === "nonNegative") return validateNonNegativeNumber(value, fieldName);
  return null;
}

export function userValidationMessage(message: string): string {
  return message.includes(": ") ? message.split(": ").slice(1).join(": ") : message;
}

export interface BuildingNumericInput {
  span_m?: number;
  length_m?: number;
  height_m?: number;
  framePitch_m?: number;
  w0_kPa?: number;
  Sg_kPa?: number;
}

export function validateBuildingNumericInput(input: BuildingNumericInput): string[] {
  const checks: Array<string | null> = [
    input.span_m === undefined ? null : validatePositiveNumber(input.span_m, "Пролёт здания"),
    input.length_m === undefined ? null : validatePositiveNumber(input.length_m, "Длина здания"),
    input.height_m === undefined ? null : validatePositiveNumber(input.height_m, "Высота здания"),
    input.framePitch_m === undefined ? null : validatePositiveNumber(input.framePitch_m, "Шаг рам"),
    input.Sg_kPa === undefined ? null : validateNonNegativeNumber(input.Sg_kPa, "Снеговая нагрузка"),
    input.w0_kPa === undefined ? null : validateNonNegativeNumber(input.w0_kPa, "Ветровая нагрузка"),
  ];
  return checks.filter((message): message is string => message !== null);
}
