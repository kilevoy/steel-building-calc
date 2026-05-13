import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useBuildingResults, type ResultItem } from "./useBuildingResults";
import {
  CraneBeamRunnerContext,
  defaultCraneInputs,
} from "./craneBeamRunnerContext";
import type { CraneCalculationResult } from "../calc/craneBeam/types";

/**
 * Поднятое состояние подкрановой балки.
 * Сохраняет dynamic import engine, чтобы workbook не возвращался в стартовый chunk.
 */
export function CraneBeamRunnerProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState(defaultCraneInputs);
  const [result, setResult] = useState<CraneCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRecalc, setAutoRecalc] = useState(false);
  const { setResult: publishResult } = useBuildingResults();

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
    <K extends keyof typeof defaultCraneInputs>(k: K, v: (typeof defaultCraneInputs)[K]) =>
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
