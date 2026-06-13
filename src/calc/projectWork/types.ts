/**
 * Входы и результат калькулятора стоимости проектных работ (раздел КМ)
 * для ангара «Великан». Источник: EXCEL-011.
 *
 * Часть полей (геометрия, кровля-форма, сейсмика, краны) приходит из
 * общего здания (BuildingContext); часть — специфична для проектных
 * работ и задаётся на самой вкладке.
 */

export type RoofKind = 1 | 2 | 3 | 4; // форма: 1=односкатная, 2=двускатная, 3=плоская, 4=многоскатная
export type WallMaterial = 1 | 2 | 3;
export type RoofingMaterial = 1 | 2 | 3 | 4; // 2=послойная сборка, иначе профлист
export type SeismicCategory = 1 | 2 | 3 | 4; // 1 = несейсмический район
/** Парапет: 3 = нет, 1 = по одной стороне, 2 = по обеим. */
export type ParapetMode = 1 | 2 | 3;
export type StairType =
  | "none"
  | "rcSingle" | "rcDouble" | "rcTriple" | "rcQuad"
  | "metalSingle" | "metalDouble" | "metalTriple" | "metalQuad";

export interface ProjectWorkInputs {
  // ——— геометрия (общая со зданием) ———
  spanCount: number;
  spanWidth1: number;
  spanWidth2: number;
  spanWidth3: number;
  spanWidth4: number;
  spanWidth5: number;
  length: number;
  framePitch: number;
  height: number;
  roof: RoofKind;
  seismic: SeismicCategory;
  overheadCrane: boolean;
  overheadCraneCapacity: number;
  suspendedCrane: boolean;
  suspendedCraneCapacity: number;

  // ——— ограждающие конструкции ———
  wallMaterial: WallMaterial;
  wallThickness: number;
  roofingMaterial: RoofingMaterial;
  snowGuard: boolean;
  roofFence: boolean;
  drainage: boolean;
  windows: boolean;
  windowCount: number;
  gates: boolean;
  gateCount: number;
  gateSpanCount: number;
  doors: boolean;
  doorCount: number;

  // ——— перегородки ———
  partitionGvl: boolean;
  partitionSandwichLayered: boolean;
  partitionSandwichFactory: boolean;
  /** Площади перегородок по типам, м². */
  partitionGvlArea: number;
  partitionSandwichLayeredArea: number;
  partitionSandwichFactoryArea: number;
  partitionOpeningsDoors: boolean;
  partitionOpeningsGates: boolean;

  // ——— парапет ———
  parapetLongSide: ParapetMode;
  parapetEnd: ParapetMode;
  parapetOverhang: boolean;

  // ——— перекрытие и антресоли ———
  floor: boolean;
  mezzanine1: boolean;
  mezzanine2: boolean;
  mezzanine3: boolean;

  // ——— лестницы ———
  stairType: StairType;
  stairCount: number;

  // ——— прочее ———
  fireResistance: number;
  /** Издержки (аренда, налоги и т.д.), доля: 0.1 = +10 %. */
  overheadCost: number;
}

export interface ProjectWorkResult {
  /** Стоимость проектных работ по разделу КМ, тыс. руб. */
  kmCostThousandRub: number | null;
  /** Срок проектирования, рабочих дней. */
  kmDurationDays: number | null;
  /** Удельная стоимость, тыс. руб/т (металлоёмкость Великана 35 кг/м²). */
  costPerTon: number | null;
}
