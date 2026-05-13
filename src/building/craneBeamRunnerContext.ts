import { createContext } from "react";
import type {
  CraneCalculationResult,
  CraneCalculatorInputs,
} from "../calc/craneBeam/types";

export const defaultCraneInputs: CraneCalculatorInputs = {
  capacity: 5,
  craneSpan: 24,
  wheelCount: 4,
  suspensionType: "гибкий",
  workGroup: "3К",
  craneCount: "один",
  rail: "Р50",
  beamSpan: 6,
  brakeStructure: "нет",
  ribStep: 0,
  gammaF: 1.2,
  gammaDynamic: 1.2,
  gammaC: 1,
  selfWeightFactor: 1.06,
  fatigueCalculation: "нет",
};

export interface CraneBeamRunnerValue {
  inputs: CraneCalculatorInputs;
  setInputs: (next: CraneCalculatorInputs) => void;
  upd: <K extends keyof CraneCalculatorInputs>(k: K, v: CraneCalculatorInputs[K]) => void;
  result: CraneCalculationResult | null;
  calculating: boolean;
  error: string | null;
  autoRecalc: boolean;
  setAutoRecalc: (v: boolean) => void;
  handleCalc: () => Promise<void>;
}

export const CraneBeamRunnerContext = createContext<CraneBeamRunnerValue | null>(null);
