import type { WindowRiegelOption } from "./calc/windowRiegel/types";

export type UsableWindowRiegelOption = WindowRiegelOption & {
  profile: string;
  weightKg: number;
};

export function isUsableWindowRiegelOption(
  option: WindowRiegelOption,
): option is UsableWindowRiegelOption {
  const profile = option.profile?.trim();
  const steel = option.steel?.trim();

  return Boolean(
    profile
      && profile !== "#N/A"
      && steel !== "#N/A"
      && option.weightKg != null
      && Number.isFinite(option.weightKg),
  );
}

export function getUsableWindowRiegelOptions(
  options: readonly WindowRiegelOption[],
): UsableWindowRiegelOption[] {
  return options.filter(isUsableWindowRiegelOption);
}
