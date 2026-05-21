import autoStepData from "../../data/purlin/autoStep.json";
import type { PurlinInput } from "./types";

interface RoofConstructionAutoStep {
  name: string;
  coveringLoadKpa: number;
  fixedAutoStepIndex: number | null;
}

interface DeckProfileAutoStep {
  profileSheet: string;
  autoStepIndex: number;
}

interface AutoStepCapacityRow {
  stepMm: number;
  capacityByIndex: number[];
}

const roofConstructions = autoStepData.roofConstructions as RoofConstructionAutoStep[];
const deckProfiles = autoStepData.deckProfiles as DeckProfileAutoStep[];
const capacityTable = autoStepData.capacityTable as AutoStepCapacityRow[];

export function getPurlinDeckProfileOptions(): string[] {
  return deckProfiles.map((item) => item.profileSheet);
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase("ru-RU").replace(/ё/g, "е");
}

function findRoofConstruction(name: string): RoofConstructionAutoStep | undefined {
  const target = normalizeText(name);
  return roofConstructions.find((item) => normalizeText(item.name) === target);
}

function findDeckProfile(profileSheet: string): DeckProfileAutoStep | undefined {
  const target = normalizeText(profileSheet);
  return deckProfiles.find((item) => normalizeText(item.profileSheet) === target);
}

export function getPurlinRoofConstructionLoadKpa(roofStructure: string): number | null {
  return findRoofConstruction(roofStructure)?.coveringLoadKpa ?? null;
}

export function resolvePurlinAutoStepIndex(params: {
  roofStructure: string;
  deckProfile: string;
}): number | null {
  const roof = findRoofConstruction(params.roofStructure);
  if (typeof roof?.fixedAutoStepIndex === "number") {
    return roof.fixedAutoStepIndex;
  }
  return findDeckProfile(params.deckProfile)?.autoStepIndex ?? null;
}

export function computePurlinAutoMaxStepMm(params: {
  input: PurlinInput;
  q_snow_kPa: number;
  q_windRoof_kPa: number;
  deckProfile?: string;
}): number | null {
  const autoStepIndex = resolvePurlinAutoStepIndex({
    roofStructure: params.input.roofStructure,
    deckProfile: params.deckProfile ?? params.input.deckProfile,
  });
  if (autoStepIndex === null) return null;

  const roofLoadKpa =
    getPurlinRoofConstructionLoadKpa(params.input.roofStructure) ?? params.input.roofLoad_kPa;
  const roofLoadWithResponsibility = roofLoadKpa * params.input.gamma_n;
  const loadForAutoStep = (params.q_snow_kPa + params.q_windRoof_kPa) * 1.15;

  if (!Number.isFinite(loadForAutoStep + roofLoadWithResponsibility)) {
    return null;
  }

  const index = autoStepIndex - 1;
  const row = [...capacityTable]
    .reverse()
    .find((item) => item.capacityByIndex[index] >= loadForAutoStep);

  const calculatedAutoStepMm =
    row?.stepMm ??
    capacityTable.reduce(
      (minStep, item) => Math.min(minStep, item.stepMm),
      Number.POSITIVE_INFINITY,
    );

  if (Number.isFinite(params.input.maxStep_mm) && params.input.maxStep_mm > 0) {
    return Math.min(calculatedAutoStepMm, params.input.maxStep_mm);
  }

  return calculatedAutoStepMm;
}
