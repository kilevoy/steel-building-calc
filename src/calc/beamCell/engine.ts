import { workbookData } from "./catalog.generated";
import type {
  BeamProfile,
  CalculatorInputs,
  CalculationResult,
  ColumnProfile,
  MemberSolution,
  PriceKind,
  Prices,
  Steel,
} from "./types";

const RY: Record<Steel, number> = { C245: 235, C345: 315 };

export const defaultInputs: CalculatorInputs = {
  lengthAlongMain: 6,
  widthAcrossMain: 6,
  columnHeight: 9,
  mainBeamSpan: 6,
  mainBeamStep: 6,
  floorType: "балка покрытия",
  floorLoadKgM2: 145,
  structureType: "встроенная в здание",
  maxSecondaryStepMode: "по умолчанию",
  maxSecondaryStepMm: 1500,
  acceptedSecondarySteel: "C345",
  acceptedMainSteel: "C345",
  acceptedColumnSteel: "C345",
  prices: {
    channelC245: 226.26,
    tubeC245: 167.9,
    ibeamC245: 193.2,
    channelC345: 236.5,
    tubeC345: 179.4,
    ibeamC345: 203.55,
  },
};

export const floorTypes: readonly string[] = workbookData.floorDeadLoads.map((x) => x.name);
export const structureTypes: readonly string[] = ["встроенная в здание", "отдельно стоящая"];
export const maxSecondaryStepModes: readonly string[] = ["по умолчанию", "1500"];

function deadLoadFor(floorType: string): number | undefined {
  return workbookData.floorDeadLoads.find((item) => item.name === floorType)?.load;
}

function ceil(value: number): number {
  return Math.ceil(value);
}

function priceFor(prices: Prices, material: Steel, kind: PriceKind): number {
  const key = `${kind}${material}` as keyof Prices;
  return prices[key];
}

function steelFrom(material: Steel): Steel {
  return material;
}

function finiteSolution(solution: MemberSolution): boolean {
  return solution.status === "OK" && Number.isFinite(solution.weightKg);
}

function qSecondary(inputs: CalculatorInputs): number | undefined {
  const dead = deadLoadFor(inputs.floorType);
  if (dead === undefined || inputs.floorType === "балка покрытия") return undefined;
  const factor = inputs.floorLoadKgM2 < 200 ? 1.3 : 1.2;
  return (inputs.floorLoadKgM2 / 100) * factor + dead;
}

function qMain(inputs: CalculatorInputs): number {
  const dead = deadLoadFor(inputs.floorType) ?? 0;
  const factor =
    inputs.floorLoadKgM2 < 200 || inputs.floorType === "балка покрытия" ? 1.3 : 1.2;
  return (inputs.floorLoadKgM2 / 100) * factor + dead;
}

function beamUtilization(
  profile: BeamProfile,
  material: Steel,
  moment: number,
  shear: number,
  lateralLimit: number,
): number {
  const ry = RY[material];
  const shearUtil =
    (shear * (profile.sx / 1_000_000)) /
    ((profile.ix / 100_000_000) * (profile.t / 1000) * 0.58 * ry * 1000);
  const bendingUtil = moment / ((profile.wx / 1_000_000) * ry * 1000);
  return Math.max(bendingUtil, shearUtil, lateralLimit);
}

function selectSecondary(inputs: CalculatorInputs, material: Steel): MemberSolution {
  const assemblyFloor = inputs.floorType === "сборные ЖБ плиты";
  const q = qSecondary(inputs);
  if (!q) {
    return {
      status: "NO_SOLUTION",
      material,
      message:
        'Нет допустимого решения: лист ВБ возвращает #N/A для выбранного типа перекрытия.',
    };
  }

  const maxStep = inputs.maxSecondaryStepMode === "по умолчанию" ? 1000 : 1500;
  let best: MemberSolution | undefined;

  for (let step = 500; step <= Math.min(1500, maxStep); step += 5) {
    const span = inputs.mainBeamStep;
    const m = ((q * (step / 1000) * span ** 2) / 8) * 1.02;
    const v = ((q * (step / 1000) * span) / 2) * 1.02;
    for (const [index, profile] of workbookData.secondaryBeamProfiles.entries()) {
      const lateralLimit =
        Math.min((inputs.mainBeamStep * 100) / profile.rx, (0.4 * 100) / profile.ry) / 150;
      const utilization = beamUtilization(profile, material, m, v, lateralLimit);
      if (utilization > 0.85) continue;
      const countFactor =
        ceil(inputs.mainBeamSpan / (step / 1000)) *
          (inputs.lengthAlongMain / inputs.mainBeamSpan) +
        1;
      const weight =
        profile.mass * inputs.widthAcrossMain * countFactor +
        (index + 1) * 0.0001 +
        (step / 1000) * 0.00001;
      const kind = profile.kind ?? "ibeam";
      const cost =
        priceFor(inputs.prices, material, kind) *
          profile.mass *
          inputs.widthAcrossMain *
          countFactor +
        (index + 1) * 0.0001 +
        (step / 1000) * 0.00001;
      if (!best || cost < (best.costRub ?? Infinity)) {
        best = {
          status: "OK",
          material,
          profile: profile.profile,
          weightKg: weight,
          stepMm: step,
          costRub: cost,
          utilization,
        };
      }
    }
  }

  if (assemblyFloor) {
    return {
      status: "SKIPPED",
      material,
      profile: "-",
      costRub: best?.costRub,
      message:
        'В Excel для сборных ЖБ плит ВБ показаны как "-", но стоимость остается с листа расчета.',
    };
  }

  return (
    best ?? {
      status: "NO_SOLUTION",
      material,
      message: "Нет профиля ВБ с utilization <= 0.85.",
    }
  );
}

function selectMainBeam(
  inputs: CalculatorInputs,
  material: Steel,
  acceptedSecondary?: MemberSolution,
): MemberSolution {
  const lef =
    inputs.floorType === "сборные ЖБ плиты" || inputs.floorType === "балка покрытия"
      ? 3
      : (acceptedSecondary?.stepMm ?? 0) / 1000;
  if (!lef)
    return {
      status: "NO_SOLUTION",
      material,
      message: "Для ГБ нужна расчетная длина из подобранного шага ВБ.",
    };

  const q = qMain(inputs);
  const moment = (q * inputs.mainBeamStep * inputs.mainBeamSpan ** 2) / 8;
  const shear = (q * inputs.mainBeamSpan * inputs.mainBeamStep) / 2;
  const beamCount = ceil(inputs.widthAcrossMain / inputs.mainBeamStep) + 1;

  let best: MemberSolution | undefined;
  const profiles = workbookData.mainBeamProfiles[material] as readonly BeamProfile[];
  for (const [index, profile] of profiles.entries()) {
    const it =
      0.37 *
      (2 * (profile.b / 10) * (profile.t / 10) ** 3 +
        ((profile.h - 2 * profile.t) / 10) * (profile.s / 10) ** 3);
    const alfa = ((1.54 * it) / profile.iy) * (lef / (profile.h / 1000)) ** 2;
    const psi = alfa > 40 ? 3.6 + 0.04 * alfa - 2.7e-5 * alfa ** 2 : 2.25 + 0.07 * alfa;
    const fi1 =
      (((psi * profile.iy) / profile.ix) * ((profile.h - profile.t) / 1000 / lef) ** 2 *
        2.06e5) /
      RY[material];
    const fib = fi1 > 0.85 ? Math.min(1, 0.68 + 0.21 * fi1) : fi1;
    const lateralRx = profile.lateralRx ?? profile.rx;
    const lateralRy = profile.lateralRy ?? profile.ry;
    const lateralLimit =
      Math.min((inputs.mainBeamSpan * 100) / lateralRx, (lef * 100) / lateralRy) / 150;
    const utilization = Math.max(
      moment / (fib * (profile.wx / 1_000_000) * RY[material] * 1000),
      (shear * (profile.sx / 1_000_000)) /
        ((profile.ix / 100_000_000) * (profile.t / 1000) * 0.58 * RY[material] * 1000),
      lateralLimit,
    );
    if (utilization > 0.85 * 0.9) continue;
    const serial = profile.serial ?? index + 1;
    const weight = profile.mass * inputs.lengthAlongMain * beamCount + serial * 0.0001;
    const cost =
      inputs.prices[`ibeam${material}` as keyof Prices] *
        profile.mass *
        inputs.lengthAlongMain *
        beamCount +
      serial * 0.0001;
    if (!best || weight < (best.weightKg ?? Infinity)) {
      best = {
        status: "OK",
        material,
        profile: profile.profile,
        weightKg: weight,
        costRub: cost,
        utilization,
      };
    }
  }

  return (
    best ?? {
      status: "NO_SOLUTION",
      material,
      message: "Нет профиля ГБ с запасом Excel utilization <= 0.765.",
    }
  );
}

function selectColumns(
  inputs: CalculatorInputs,
  material: Steel,
  columnLoadKn?: number,
): MemberSolution {
  if (!columnLoadKn || !Number.isFinite(columnLoadKn)) {
    return {
      status: "NO_SOLUTION",
      material,
      message: "Нагрузка на колонну не определена из-за отсутствия ВБ/итога без колонн.",
    };
  }
  const lef =
    inputs.columnHeight * (inputs.structureType === "встроенная в здание" ? 1 : 2);
  let best: MemberSolution | undefined;

  for (const profile of workbookData.columnProfiles[material] as readonly ColumnProfile[]) {
    const lambdaInPlane = lef / (profile.rx / 100);
    const lambdaOutPlane = lef / (profile.ry / 100);
    const lambdaReducedInPlane = lambdaInPlane * Math.sqrt(RY[material] / 2.06e5);
    const lambdaReducedOutPlane = lambdaOutPlane * Math.sqrt(RY[material] / 2.06e5);
    const deltaInPlane =
      9.87 * (1 - profile.alpha + profile.betaInPlane * lambdaReducedInPlane) +
      lambdaReducedInPlane ** 2;
    const deltaOutPlane =
      9.87 * (1 - profile.alpha + profile.betaOutPlane * lambdaReducedOutPlane) +
      lambdaReducedOutPlane ** 2;
    const phi =
      Math.max(lambdaReducedInPlane, lambdaReducedOutPlane) < 0.6
        ? 1
        : Math.min(
            (0.5 *
              (deltaInPlane - Math.sqrt(deltaInPlane ** 2 - 39.48 * lambdaReducedInPlane ** 2))) /
              lambdaReducedInPlane ** 2,
            (0.5 *
              (deltaOutPlane - Math.sqrt(deltaOutPlane ** 2 - 39.48 * lambdaReducedOutPlane ** 2))) /
              lambdaReducedOutPlane ** 2,
          );
    const utilization = columnLoadKn / (phi * (profile.area / 10000) * RY[material] * 1000);
    const slenderLimit = 210 - 60 * utilization;
    if (
      utilization > 1 ||
      profile.excluded ||
      Math.max(lambdaInPlane, lambdaOutPlane) > slenderLimit
    )
      continue;
    const cost = profile.mass * lef * priceFor(inputs.prices, material, profile.kind) + profile.serial * 0.0001;
    if (!best || cost < (best.costRub ?? Infinity)) {
      best = {
        status: "OK",
        material,
        profile: profile.profile,
        weightKg: profile.mass * lef,
        costRub: cost,
        utilization,
      };
    }
  }

  return (
    best ?? {
      status: "NO_SOLUTION",
      material,
      message: "Нет профиля колонны, прошедшего проверки Excel.",
    }
  );
}

export function calculate(input: CalculatorInputs): CalculationResult {
  const inputs = { ...input, prices: { ...input.prices } };
  const assemblyFloor = inputs.floorType === "сборные ЖБ плиты";
  const warnings: string[] = [];
  const secondary = {
    C245: selectSecondary(inputs, "C245"),
    C345: selectSecondary(inputs, "C345"),
  };
  const acceptedSecondary = secondary[steelFrom(inputs.acceptedSecondarySteel)];
  const main = {
    C245: selectMainBeam(inputs, "C245", acceptedSecondary),
    C345: selectMainBeam(inputs, "C345", acceptedSecondary),
  };
  const acceptedMain = main[steelFrom(inputs.acceptedMainSteel)];

  const secondaryWeight =
    acceptedSecondary.status === "SKIPPED" ? 0 : acceptedSecondary.weightKg;
  const secondaryCost = acceptedSecondary.status === "SKIPPED" ? 0 : acceptedSecondary.costRub;
  const withoutColumnsKg =
    finiteSolution(acceptedMain) && secondaryWeight !== undefined
      ? (secondaryWeight ?? 0) + (acceptedMain.weightKg ?? 0)
      : undefined;
  const withoutColumnsCostRub =
    finiteSolution(acceptedMain) && secondaryCost !== undefined
      ? (secondaryCost ?? 0) + (acceptedMain.costRub ?? 0)
      : undefined;
  const qForColumns = qSecondary(inputs);
  const columnLoadKn =
    withoutColumnsKg !== undefined && qForColumns !== undefined
      ? inputs.mainBeamSpan *
        inputs.mainBeamStep *
        (qForColumns + withoutColumnsKg / 100 / (inputs.lengthAlongMain * inputs.widthAcrossMain))
      : undefined;
  const columns = {
    C245: selectColumns(inputs, "C245", columnLoadKn),
    C345: selectColumns(inputs, "C345", columnLoadKn),
  };
  const acceptedColumns = columns[steelFrom(inputs.acceptedColumnSteel)];
  const columnCount =
    (ceil(inputs.lengthAlongMain / inputs.mainBeamSpan) + 1) *
    (ceil(inputs.widthAcrossMain / inputs.mainBeamStep) + 1);
  const withColumnsKg =
    !assemblyFloor && withoutColumnsKg !== undefined && finiteSolution(acceptedColumns)
      ? withoutColumnsKg + (acceptedColumns.weightKg ?? 0)
      : undefined;
  const withColumnsCostRub =
    !assemblyFloor && withoutColumnsCostRub !== undefined && finiteSolution(acceptedColumns)
      ? withoutColumnsCostRub + (acceptedColumns.costRub ?? 0) * columnCount
      : undefined;

  return {
    qSecondary: qSecondary(inputs),
    qMain: qMain(inputs),
    secondary,
    main,
    columns,
    accepted: {
      secondary: acceptedSecondary,
      main: acceptedMain,
      columns: acceptedColumns,
    },
    totals: {
      withoutColumnsKg,
      withoutColumnsCostRub,
      withColumnsKg,
      withColumnsCostRub,
    },
    columnLoadKn,
    warnings,
  };
}
