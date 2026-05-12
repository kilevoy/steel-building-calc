import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type {
  CraneCalculationResult,
  CraneCalculatorInputs,
} from "../calc/craneBeam/types";
import { useBuildingResults, type ResultItem } from "./results";

const defaultCraneInputs: CraneCalculatorInputs = {
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

/**
 * Поднятое состояние подкрановой балки (HyperFormula, ~3–10 сек).
 * Позволяет запускать расчёт и читать результат из любой вкладки —
 * в т.ч. со вкладки «Сводка» без перехода на вкладку «Подкрановая балка».
 */
interface CraneBeamRunnerValue {
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

const CraneBeamRunnerContext = createContext<CraneBeamRunnerValue | null>(null);

export function CraneBeamRunnerProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<CraneCalculatorInputs>(defaultCraneInputs);
  const [result, setResult] = useState<CraneCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRecalc, setAutoRecalc] = useState(false);
  const { setResult: publishResult } = useBuildingResults();

  // Publish into shared results bus for the Summary tab.
  useEffect(() => {
    if (!result || !result.profile || result.weightKg == null) {
      publishResult("craneBeam", null);
      return;
    }
    const item: ResultItem = {
      profile: result.profile,
      steel: "С345",
      massPerPiece_kg: result.weightKg,
      count: 1,
      totalMass_kg: result.weightKg,
      cost_rub: 0,
    };
    publishResult("craneBeam", item);
  }, [result, publishResult]);

  const upd = useCallback(
    <K extends keyof CraneCalculatorInputs>(k: K, v: CraneCalculatorInputs[K]) =>
      setInputs((cur) => ({ ...cur, [k]: v })),
    [],
  );

  const handleCalc = useCallback(async () => {
    setCalculating(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 0));
    try {
      const { calculateCraneBeam } = await import("../calc/craneBeam/engine");
      const r = calculateCraneBeam(inputs);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally {
      setCalculating(false);
    }
  }, [inputs]);

  // Debounced auto-recompute when enabled.
  useEffect(() => {
    if (!autoRecalc) return;
    const t = setTimeout(() => {
      void handleCalc();
    }, 600);
    return () => clearTimeout(t);
  }, [inputs, autoRecalc, handleCalc]);

  return (
    <CraneBeamRunnerContext.Provider
      value={{
        inputs,
        setInputs,
        upd,
        result,
        calculating,
        error,
        autoRecalc,
        setAutoRecalc,
        handleCalc,
      }}
    >
      {children}
    </CraneBeamRunnerContext.Provider>
  );
}

export function useCraneBeamRunner(): CraneBeamRunnerValue {
  const ctx = useContext(CraneBeamRunnerContext);
  if (!ctx) throw new Error("useCraneBeamRunner must be used inside <CraneBeamRunnerProvider>");
  return ctx;
}
