import profilesJson from "../data/profiles/profiles.json";
import type { ProfileData } from "./types";

const PROFILES = profilesJson as ProfileData[];

/**
 * Профили, которые исходный Excel («Калькулятор колонн v6.1», лист
 * «Расчет», столбец H «исключалка») вручную исключает из подбора как
 * неходовые/сложные в закупке типоразмеры, независимо от прочностных
 * проверок. Служит дефолтом для `Building.excludedProfileNames`,
 * который пользователь может редактировать в интерфейсе.
 */
export const DEFAULT_EXCLUDED_PROFILES: readonly string[] = PROFILES.filter(
  (p) => p.nonStandard,
).map((p) => p.name);
