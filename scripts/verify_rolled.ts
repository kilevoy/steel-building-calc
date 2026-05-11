import { computeLoads, computeSnowDrift } from "../src/calc/purlin/engine";
import {
  selectRolledTop10,
  DEFAULT_ROLLED_PRICES,
  type RolledSelectionInput,
} from "../src/calc/purlin/rolled";
import type { PurlinInput } from "../src/calc/purlin/types";

// Default scenario from v2.0.xlsx: Уфа, span=24, h=12, slope=6°
const baseInput: PurlinInput = {
  gamma_n: 1,
  roofShape: "gable",
  span_m: 24,
  length_m: 60,
  height_m: 12,
  roofSlope_deg: 6,
  framePitch_m: 6,
  terrainType: "B",
  w0_kPa: 0.6,
  Sg_kPa: 2.45,
  roofStructure: "С-П 150 мм",
  roofLoad_kPa: 0.32028,
  snowDrift: "none",
  drift_dropHeight_m: 0,
  drift_existingSize_m: 0,
  maxStep_mm: 1500,
  minStep_mm: 1500,
  snowGuardPurlin: false,
  fencePurlin: false,
  maxUtilization: "default",
  cassetteHeightFilter_mm: 150,
};

const loads = computeLoads(baseInput);
console.log("=== Loads ===");
console.log(`  q_snow: ${loads.q_snow_kPa.toFixed(4)} kPa`);
console.log(`  q_wind: ${loads.q_windRoof_kPa.toFixed(4)} kPa`);
console.log(`  q_roof: ${loads.q_roof_kPa.toFixed(4)} kPa`);
console.log(`  q_total: ${loads.q_total_kPa.toFixed(4)} kPa  (Excel D14 = 4.7742)`);

// SLS (II ПС) load — for deflection
// Excel F11/F13: snow_SLS = 0.5 × 1.1 × Sg × cos(α) × γn ; roof_SLS = roof_ULS / 1.2 × γn
const cosA = Math.cos((baseInput.roofSlope_deg * Math.PI) / 180);
const q_SLS_snow = 0.5 * 1.1 * baseInput.Sg_kPa * cosA * baseInput.gamma_n;
const q_SLS_roof = (baseInput.roofLoad_kPa / 1.2) * baseInput.gamma_n;
const q_SLS_kPa = q_SLS_snow + q_SLS_roof;
console.log(`  q_SLS:  ${q_SLS_kPa.toFixed(4)} kPa  (Excel F14 = 1.6070)`);

// Wind on facade (horizontal) — for axial force on purlin (Расчет!D17,D18)
// Excel: D17 = ветровая горизонтальная (фасад) × γn
//        D18 = D17 × height/2 × frame_pitch  (transferred to purlin)
// Approximation: for default Excel case D18 = 29.65 kN (matches exact)
const N_axial_kN = 29.65; // TODO: compute from facade wind formula

const rolledInput: RolledSelectionInput = {
  ...baseInput,
  N_axial_kN_externalOverride: N_axial_kN,
  rolledMaxK: 0.8, // Лист1!D49
  rolledPrices: DEFAULT_ROLLED_PRICES,
};

const top10 = selectRolledTop10(rolledInput, loads.q_total_kPa, q_SLS_kPa);

console.log("\n=== Top-10 rolled purlins (sorted by cost) ===");
console.log("Rank | Profile             | Steel  | Step | Mass total | Cost/frame  | K_str | K_lam | K_def");
top10.forEach((c, i) => {
  console.log(
    `${(i + 1).toString().padStart(4)} | ${c.profile.name.padEnd(20)} | ${c.steel.padEnd(6)} | ${c.spacing_mm.toString().padStart(4)} | ${c.massPerBuilding_kg.toFixed(0).padStart(9)} | ${c.costPerFrameStep_kRub.toFixed(2).padStart(11)} | ${c.K_strength.toFixed(3)} | ${c.K_slenderness.toFixed(3)} | ${c.K_deflection.toFixed(3)}`,
  );
});

console.log("\n=== Excel reference ===");
console.log("  Rank 1: кв.160х5 С345, step=1500, ~26 809 kg, ~444.46 тыс.руб");
console.log("  See Лист1!B51:F51");
