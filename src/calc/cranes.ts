import type { CalculationInput } from "./types";

export function hasColumnCrane(input: CalculationInput): boolean {
  return input.overheadCrane.enabled || input.suspendedCrane.enabled;
}
