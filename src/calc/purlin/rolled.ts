/**
 * Rolled-section purlin selection (двутавры / трубы / швеллеры).
 * Mirrors v2.0.xlsx Лист1 r49–60 ("Подобранные сечения") + Расчет sheet logic.
 *
 * Selection rule per Excel cell EQK4..FLE4 / DVN4 (filter):
 *   strength util  σ = (N/A + (M_q + M_self)/Wx + M_q·tan(α)/Wy) / Ry  ≤ maxK
 *   slenderness λ_max = max(L_in/ix, L_out/iy)  ≤ 200
 *   deflection f = 5/384 · (q + selfweight) · L⁴ / (E·Ix)  ≤ L/200
 *   step in [minStep, maxStep]
 */

import type { ProfileData, SteelGrade } from "../types";
import { getRy } from "../steel";
import type { PurlinInput } from "./types";
import rolledCatalog from "../../data/purlin/rolled.json";
import disabledList from "../../data/purlin/disabled.json";

/** Set of profile|steel keys that are disabled in Excel (Расчет!G="-" filter). */
const DISABLED_COMBOS = new Set<string>(
  (disabledList as { name: string; steel: SteelGrade }[]).map(
    (d) => `${d.name}|${d.steel}`,
  ),
);

export interface RolledCandidate {
  profile: ProfileData;
  steel: SteelGrade;
  spacing_mm: number;
  /** Total mass for whole building (kg) — equivalent to Лист1!E51. */
  massPerBuilding_kg: number;
  /** Cost per frame step (тыс. руб) — equivalent to Лист1!F51. */
  costPerFrameStep_kRub: number;
  /** Max utilization (= max(σ, λ/200, f/L_lim)). */
  K: number;
  K_strength: number;
  K_slenderness: number;
  K_deflection: number;
  K_axialBuckling: number;
}

/** Steel grades available for each profile category, per v2.0 Лист1 r31–36. */
const STEELS_FOR_CATEGORY: Record<ProfileData["category"], SteelGrade[]> = {
  beam_normal: ["С255Б", "С355Б"],
  beam_wide: ["С255Б", "С355Б"],
  beam_column: ["С255Б", "С355Б"],
  square_tube: ["С245", "С345"],
  rect_tube: ["С245", "С345"],
  channel_parallel: ["С245", "С345"],
};

/**
 * Lateral-torsional buckling (LTB) screening:
 * Open sections (I-beams, channels) used as unrestrained purlins fail the СП 16
 * LTB check (Расчет!DJX) for the typical 6 m frame pitch — Excel φb is ~0.02–0.05
 * pushing K up to 30–40. For closed sections (tubes), φb ≈ 1, so they govern
 * by strength only. Mirror Excel by skipping open sections in selection.
 */
const LTB_SAFE_CATEGORIES: Set<ProfileData["category"]> = new Set([
  "square_tube",
  "rect_tube",
]);

export interface RolledPrices {
  /** Двутавр С255Б, руб/кг */
  beam_C255B: number;
  /** Двутавр С355Б, руб/кг */
  beam_C355B: number;
  /** Труба С245, руб/кг */
  tube_C245: number;
  /** Труба С345, руб/кг */
  tube_C345: number;
  /** Швеллер С245, руб/кг */
  channel_C245: number;
  /** Швеллер С345, руб/кг */
  channel_C345: number;
}

export const DEFAULT_ROLLED_PRICES: RolledPrices = {
  beam_C255B: 150,
  beam_C355B: 160,
  tube_C245: 160,
  tube_C345: 170,
  channel_C245: 170,
  channel_C345: 180,
};

function priceFor(profile: ProfileData, steel: SteelGrade, prices: RolledPrices): number {
  if (profile.category === "square_tube" || profile.category === "rect_tube") {
    return steel === "С245" ? prices.tube_C245 : prices.tube_C345;
  }
  if (profile.category === "channel_parallel") {
    return steel === "С245" ? prices.channel_C245 : prices.channel_C345;
  }
  // beams
  return steel === "С255Б" ? prices.beam_C255B : prices.beam_C355B;
}

const CATALOG = rolledCatalog as ProfileData[];

/**
 * Number of purlins per frame step length (used as Excel row 3 multiplier in Расчет).
 *
 * Formula (matches Excel "Расчет!EQK$3" for step s):
 *   (ceil(L_slope / s) + 1) × 2 × frame_pitch
 * where L_slope = (span - 0.3) / 2 for gable, otherwise (span - 0.3).
 */
function stepRow3Factor(input: PurlinInput, step_mm: number): number {
  const slopeFactor = input.roofShape === "gable" ? 2 : 1;
  const halfSlope_m = (input.span_m - 0.3) / slopeFactor;
  const s_m = step_mm / 1000;
  const baseCount = Math.ceil(halfSlope_m / s_m) + 1;
  return baseCount * 2 * input.framePitch_m;
}

export interface RolledLoadContext {
  q_total_kPa: number;
  /** SLS (II ПС) load for deflection check, kPa. */
  q_SLS_kPa: number;
  N_axial_kN: number;
  q_horizontalWind_kPa: number;
  L_inPlane_m: number;
  L_outPlane_m: number;
  slope_rad: number;
  gamma_n: number;
  gamma_c_factor: number;
}

function evalRolled(
  profile: ProfileData,
  steel: SteelGrade,
  step_mm: number,
  ctx: RolledLoadContext,
): {
  K_strength: number;
  K_slenderness: number;
  K_deflection: number;
  K_axialBuckling: number;
} {
  const s_m = step_mm / 1000;
  const L = ctx.L_inPlane_m;
  const L_out = ctx.L_outPlane_m;

  // ULS load on purlin: q × s + selfweight; in kN/m
  const q_purlin_kNm = ctx.q_total_kPa * s_m;
  const sw_kNm = profile.mass_kg_per_m / 100;
  // SLS (II ПС) load for deflection check
  const q_SLS_kNm = ctx.q_SLS_kPa * s_m;
  // Bending moments (kN·m)
  const M_q = (q_purlin_kNm * L * L) / 8;
  const M_self = (sw_kNm * L * L) / 8;
  const M_y = M_q * Math.tan(ctx.slope_rad); // out-of-plane

  // Section properties to SI
  const A_m2 = profile.A_cm2 * 1e-4;
  const Wx_m3 = profile.Wx_cm3 * 1e-6;
  const Wy_m3 = profile.Wy_cm3 * 1e-6;
  const Ix_m4 = profile.Ix_cm4 * 1e-8;
  const Ry_MPa = getRy(steel, profile);

  // Strength (Excel VD4 / AEJ4): σ = N/A + (M_q+M_self)/Wx + M_q·tan(α)/Wy ≤ Ry
  const sigma_kPa =
    ctx.N_axial_kN / A_m2 + (M_q + M_self) / Wx_m3 + M_y / Wy_m3;
  const sigma_MPa = sigma_kPa / 1000;
  const K_strength = sigma_MPa / (Ry_MPa * ctx.gamma_c_factor);

  // Slenderness λ_max / 200 (Excel AG4)
  const lambda_x = (L * 100) / profile.ix_cm;
  const lambda_y = (L_out * 100) / profile.iy_cm;
  const lambda_max = Math.max(lambda_x, lambda_y);
  const K_slenderness = lambda_max / 200;

  // Deflection (Excel CFU4): uses SLS load, NOT ULS
  // f = 5/384 × (q_SLS + sw) × L⁴ / (E·Ix), E = 2.06e8 kPa
  const E_kPa = 2.06e8;
  const f_m =
    ((5 / 384) * (q_SLS_kNm + sw_kNm) * Math.pow(L, 4)) / (E_kPa * Ix_m4);
  const K_deflection = f_m / (L / 200);

  // Axial buckling (Excel DAR4): N / (φ · A · Ry) ≤ 1
  // φ_e from СП 16 curve "b" approximation (good for hot-rolled / cold-formed boxes).
  const lambda_bar = lambda_max * Math.sqrt((Ry_MPa * 1e6) / 2.06e11);
  let phi: number;
  if (lambda_bar <= 0.5) phi = 1;
  else if (lambda_bar < 4.5) {
    // СП 16 curve "b": φ ≈ (0.929 - 0.0934 λ̄ + 0.0096 λ̄² - 0.00043 λ̄³) ; clamped
    phi = 0.929 - 0.0934 * lambda_bar + 0.0096 * lambda_bar ** 2;
    if (phi < 0.05) phi = 0.05;
  } else {
    phi = 7.6 / (lambda_bar * lambda_bar);
  }
  if (phi > 1) phi = 1;
  const K_axialBuckling =
    ctx.N_axial_kN / (phi * (profile.A_cm2 * 1e-4) * Ry_MPa * 1000);

  return { K_strength, K_slenderness, K_deflection, K_axialBuckling };
}

export interface RolledSelectionInput extends PurlinInput {
  /** Pre-computed q_total in kPa from main load calculation. */
  q_total_kPa_externalOverride?: number;
  /** Optional axial force on purlin (kN), e.g. from facade wind transfer. */
  N_axial_kN_externalOverride?: number;
  /** Out-of-plane effective length override. */
  L_outPlane_m_override?: number;
  /** Max strength utilization (e.g. 0.8). */
  rolledMaxK: number;
  /** Prices per category × grade (руб/кг). */
  rolledPrices: RolledPrices;
}

/**
 * Run rolled-purlin selection at fixed step (=input.maxStep_mm),
 * matching Excel default. Returns top-10 by total cost.
 *
 * Excel uses min=max=Лист1!B40=1500, so it's a single-step selection.
 * We support iterating maxStep..minStep but typically use a single value.
 */
export function selectRolledTop10(
  input: RolledSelectionInput,
  q_total_kPa: number,
  q_SLS_kPa: number,
): RolledCandidate[] {
  const ctx: RolledLoadContext = {
    q_total_kPa,
    q_SLS_kPa,
    N_axial_kN: input.N_axial_kN_externalOverride ?? 0,
    q_horizontalWind_kPa: 0,
    L_inPlane_m: input.framePitch_m,
    L_outPlane_m: input.L_outPlane_m_override ?? input.framePitch_m,
    slope_rad: (input.roofSlope_deg * Math.PI) / 180,
    gamma_n: input.gamma_n,
    gamma_c_factor: 1,
  };

  const minS = Math.min(input.minStep_mm, input.maxStep_mm);
  const maxS = Math.max(input.minStep_mm, input.maxStep_mm);
  const all: RolledCandidate[] = [];
  const seen = new Set<string>(); // dedup by (profile, steel, step)

  for (let s_mm = minS; s_mm <= maxS; s_mm += 5) {
    const stepFactor = stepRow3Factor(input, s_mm);
    for (const profile of CATALOG) {
      // LTB screening — only closed tubes for unrestrained purlins
      if (!LTB_SAFE_CATEGORIES.has(profile.category)) continue;
      for (const steel of STEELS_FOR_CATEGORY[profile.category]) {
        // Excel-equivalent "disabled" filter (Расчет!G="-")
        if (DISABLED_COMBOS.has(`${profile.name}|${steel}`)) continue;
        const checks = evalRolled(profile, steel, s_mm, ctx);
        const K = Math.max(
          checks.K_strength,
          checks.K_slenderness,
          checks.K_deflection,
          checks.K_axialBuckling,
        );
        if (
          checks.K_strength > input.rolledMaxK ||
          checks.K_axialBuckling > input.rolledMaxK ||
          checks.K_slenderness > 1 ||
          checks.K_deflection > 1
        ) {
          continue;
        }
        // Mass per frame step (kg) = stepFactor × mass/m
        const massPerFrameStep_kg = stepFactor * profile.mass_kg_per_m;
        // Total mass per building (kg) — Лист1!E51 formula
        // = m_frame × 1.03 × length / frame_pitch
        const massPerBuilding_kg =
          (massPerFrameStep_kg * 1.03 * input.length_m) / input.framePitch_m;
        const price = priceFor(profile, steel, input.rolledPrices);
        const costPerFrameStep_kRub = (massPerFrameStep_kg * price) / 1000;
        const key = `${profile.name}|${steel}|${s_mm}`;
        if (seen.has(key)) continue;
        seen.add(key);
        all.push({
          profile,
          steel,
          spacing_mm: s_mm,
          massPerBuilding_kg,
          costPerFrameStep_kRub,
          K,
          K_strength: checks.K_strength,
          K_slenderness: checks.K_slenderness,
          K_deflection: checks.K_deflection,
          K_axialBuckling: checks.K_axialBuckling,
        });
      }
    }
  }
  // Sort by cost (= total mass × price; matches Excel sort key GGC = MIN cost).
  all.sort((a, b) => a.costPerFrameStep_kRub - b.costPerFrameStep_kRub);
  return all.slice(0, 10);
}
