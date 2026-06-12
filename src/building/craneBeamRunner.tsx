import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useBuildingResults } from "./useBuildingResults";
import { useBuilding } from "./useBuilding";
import {
  CraneBeamRunnerContext,
  defaultCraneInputs,
} from "./craneBeamRunnerContext";
import { buildCraneBeamResultItem } from "./craneBeamResultPublisher";
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
  const { building } = useBuilding();

  useEffect(() => {
    if (building.hasCrane) return;
    setResult(null);
    setError(null);
    setCalculating(false);
    publishResult("craneBeam", null);
  }, [building.hasCrane, publishResult]);

  useEffect(() => {
    if (!building.hasCrane) return;
    // Прогрев: workbook-чанк (~2.7 МБ) и HyperFormula качаются в фоне сразу
    // после включения крана, чтобы вкладка и сводка не ждали загрузку.
    void import("../calc/craneBeam/engine").catch(() => {
      /* офлайн/сбой сети — расчёт сам повторит импорт и покажет ошибку */
    });
  }, [building.hasCrane]);

  useEffect(() => {
    const item = buildCraneBeamResultItem(result, {
      buildingLength_m: building.length_m,
      beamSpan_m: inputs.beamSpan,
      priceC345_rubKg: building.priceC345_rubKg,
    });
    if (!item) {
      publishResult("craneBeam", null);
      return;
    }
    publishResult("craneBeam", item);
  }, [result, building.length_m, building.priceC345_rubKg, inputs.beamSpan, publishResult]);

  const upd = useCallback(
    <K extends keyof typeof defaultCraneInputs>(k: K, v: (typeof defaultCraneInputs)[K]) =>
      setInputs((cur) => ({ ...cur, [k]: v })),
    [],
  );

  const handleCalc = useCallback(async () => {
    if (!building.hasCrane) {
      setResult(null);
      setError("Кран не включён на вкладке «Колонна».");
      publishResult("craneBeam", null);
      return;
    }
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
  }, [building.hasCrane, inputs, publishResult]);

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
