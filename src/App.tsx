import { lazy, Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BuildingSummaryBanner } from "./components/BuildingSummaryBanner";
import { ProjectsMenu } from "./components/ProjectsMenu";
import { ColumnApp } from "./columnTab/ColumnApp";

const TrussApp = lazy(() => import("./TrussApp").then((m) => ({ default: m.TrussApp })));
const PurlinApp = lazy(() => import("./PurlinApp").then((m) => ({ default: m.PurlinApp })));
const BeamCellApp = lazy(() => import("./BeamCellApp").then((m) => ({ default: m.BeamCellApp })));
const WindowRiegelApp = lazy(() => import("./WindowRiegelApp").then((m) => ({ default: m.WindowRiegelApp })));
const CraneBeamApp = lazy(() => import("./CraneBeamApp").then((m) => ({ default: m.CraneBeamApp })));
const SummaryApp = lazy(() => import("./SummaryApp").then((m) => ({ default: m.SummaryApp })));

const TAB_FALLBACK = (
  <div className="text-muted" style={{ padding: 16 }}>
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

/**
 * Активная вкладка отражается в URL-хеше (`#summary` и т.п.): ссылку на
 * конкретную вкладку можно сохранить или переслать, кнопки «назад/вперёд»
 * браузера переключают вкладки.
 */
function modeFromHash(): Mode {
  if (typeof window === "undefined") return "column";
  const h = window.location.hash.replace(/^#/, "");
  return (MODES as readonly string[]).includes(h) ? (h as Mode) : "column";
}

export function App() {
  const [mode, setMode] = useState<Mode>(modeFromHash);

  useEffect(() => {
    const onHashChange = () => setMode(modeFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const current = window.location.hash.replace(/^#/, "");
    if (current === mode) return;
    // Первый заход без хеша не должен плодить запись в истории.
    if (current === "") {
      window.history.replaceState(null, "", `#${mode}`);
    } else {
      window.history.pushState(null, "", `#${mode}`);
    }
  }, [mode]);

  return (
    <div className="app-shell">
      <div className="tabs">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={mode === m ? "tab tab--active" : "tab"}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <BuildingSummaryBanner />
        </div>
        <ProjectsMenu />
      </div>
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
