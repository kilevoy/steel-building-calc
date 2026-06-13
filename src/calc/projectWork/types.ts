/**
 * Входы и результат калькулятора стоимости проектных работ (раздел КМ)
 * для ангара «Великан». Источник: EXCEL-011.
 */

export type RoofKind = 1 | 2 | 3 | 4; // 1=односкатная, 2=двускатная, 3=плоская, 4=многоскатная
export type WallMaterial = 1 | 2 | 3;
export type SeismicCategory = 1 | 2 | 3 | 4; // 1 = несейсмический район

export interface ProjectWorkInputs {
  /** Количество пролётов поперёк здания (1…5). */
  spanCount: number;
  /** Ширины пролётов, м (по числу пролётов; лишние игнорируются). */
  spanWidth1: number;
  spanWidth2: number;
  spanWidth3: number;
  spanWidth4: number;
  spanWidth5: number;
  /** Длина здания, м. */
  length: number;
  /** Шаг рам, м. */
  framePitch: number;
  /** Высота здания, м. */
  height: number;

  roof: RoofKind;
  seismic: SeismicCategory;

  wallMaterial: WallMaterial;
  /** Индекс толщины стен (как в исходной книге). */
  wallThickness: number;

  windows: boolean;
  windowCount: number;
  gates: boolean;
  doors: boolean;
  doorCount: number;

  overheadCrane: boolean;
  overheadCraneCapacity: number;
  suspendedCrane: boolean;
  suspendedCraneCapacity: number;

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
