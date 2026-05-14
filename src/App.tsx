import { lazy, Suspense, useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BuildingSummaryBanner } from "./components/BuildingSummaryBanner";
import { ColumnApp } from "./columnTab/ColumnApp";

const TrussApp = lazy(() => import("./TrussApp").then((m) => ({ default: m.TrussApp })));
const PurlinApp = lazy(() => import("./PurlinApp").then((m) => ({ default: m.PurlinApp })));
const BeamCellApp = lazy(() => import("./BeamCellApp").then((m) => ({ default: m.BeamCellApp })));
const WindowRiegelApp = lazy(() => import("./WindowRiegelApp").then((m) => ({ default: m.WindowRiegelApp })));
const CraneBeamApp = lazy(() => import("./CraneBeamApp").then((m) => ({ default: m.CraneBeamApp })));
const SummaryApp = lazy(() => import("./SummaryApp").then((m) => ({ default: m.SummaryApp })));

const TAB_FALLBACK = (
  <div className="p-4 text-sm text-slate-500">
    Загрузка модуля расчёта…
  </div>
);

type Mode = "column" | "truss" | "purlins" | "beamCell" | "windowRiegel" | "craneBeam" | "summary";

const MODE_LABELS: Record<Mode, string> = {
  column: "Колонна",
  truss: "Ферма",
  purlins: "Прогоны",
  beamCell: "Балка покрытия",
  windowRiegel: "Оконные ригели",
  craneBeam: "Подкрановая балка",
  summary: "Сводка",
};

const MODES: readonly Mode[] = [
  "column",
  "truss",
  "purlins",
  "beamCell",
  "windowRiegel",
  "craneBeam",
  "summary",
] as const;

/**
 * Lazy-loaded tab wrapped in its own ErrorBoundary + Suspense. Each tab
 * mounts independently, so a failure inside one (e.g. a thrown render
 * error in `TrussApp`) does not take down the rest of the app.
 *
 * The `key` parameter on ErrorBoundary ensures that switching tabs
 * resets any caught error state from a previously failed tab.
 */
function LazyTab({ active, children }: { active: Mode; children: React.ReactNode }) {
  return (
    <ErrorBoundary key={active}>
      <Suspense fallback={TAB_FALLBACK}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export function App() {
  const [mode, setMode] = useState<Mode>("column");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1400, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "2px solid #e2e8f0", flexWrap: "wrap" }}>
        {MODES.map((m) => {
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "10px 24px",
                fontSize: 15,
                fontWeight: 600,
                background: isActive ? "#0369a1" : "transparent",
                color: isActive ? "white" : "#475569",
                border: "none",
                borderRadius: "6px 6px 0 0",
                cursor: "pointer",
                marginBottom: -2,
                borderBottom: isActive ? "2px solid #0369a1" : "2px solid transparent",
              }}
            >
              {MODE_LABELS[m]}
            </button>
          );
        })}
      </div>
      <BuildingSummaryBanner />
      {mode === "column" && (
        <ErrorBoundary key={mode}>
          <ColumnApp />
        </ErrorBoundary>
      )}
      {mode === "truss" && <LazyTab active={mode}><TrussApp /></LazyTab>}
      {mode === "purlins" && <LazyTab active={mode}><PurlinApp /></LazyTab>}
      {mode === "beamCell" && <LazyTab active={mode}><BeamCellApp /></LazyTab>}
      {mode === "windowRiegel" && <LazyTab active={mode}><WindowRiegelApp /></LazyTab>}
      {mode === "craneBeam" && <LazyTab active={mode}><CraneBeamApp /></LazyTab>}
      {mode === "summary" && <LazyTab active={mode}><SummaryApp /></LazyTab>}
    </div>
  );
}
