import { useMemo, useState, useCallback, useEffect } from "react";
import { runTrussCalculation, getDefaultMinThickness } from "./calc/truss/engine";
import { useBuilding, type Building } from "./building/useBuilding";
import { useBuildingResults } from "./building/useBuildingResults";
import { useRoofTotalLoad_kPa } from "./building/loadPropagation";
import { SyncedNumField, SyncedSelectField } from "./building/SyncedField";
import { PricesBlock } from "./building/PricesBlock";
import { Collapsible } from "./building/Collapsible";
import { validateBuildingNumericInput } from "./utils/validation";
import {
  TRUSS_SECTIONS,
  TRUSS_SECTION_LABELS,
  TRUSS_SECTION_SHORT,
  type TrussInput,
  type TrussOutput,
  type TrussSection,
} from "./calc/truss/types";
import type { SettlementClimateData } from "./types/climate";
import {
  getSettlementClimateByIdAsync,
  searchSettlementsAsync,
} from "./services/settlements";
import { buildTrussResultPayload } from "./trussResultPublisher";
import structuresJson from "./data/structures/structures.json";

interface StructureRow {
  id: string;
  kPa: number;
}
const STRUCTURES = structuresJson as StructureRow[];

function lookupStructure(id: string): StructureRow | undefined {
  return STRUCTURES.find((s) => s.id === id);
}

const DEFAULT_INPUT: TrussInput = {
  height_m: 12,
  span_m: 24,
  length_m: 30,
  framePitch_m: 6,
  purlinPitch_mm: 0,
  roofSlope_deg: 6,
  responsibilityCoeff: 1,
  terrainType: "B",
  w0_kPa: 0.3,
  Sg_kPa: 1.2,
  roofStructure: "наше 250 мм",
  roofLoad_kPa: 0.24,
  loadAddition_pct: 15,
  maxUtilization: 0.85,
  minThickness_mm: getDefaultMinThickness(),
  maxWidth_mm: { VP: 500, NP: 500 },
  minWidth_mm: { ORb: 80, OR: 80, RR: 60 },
};

export function TrussApp() {
  const { building, setBuilding } = useBuilding();
  const initialRoof = lookupStructure(building.roofStructure);
  const [input, setInput] = useState<TrussInput>(() => ({
    ...DEFAULT_INPUT,
    span_m: building.span_m,
    length_m: building.length_m,
    height_m: building.height_m,
    roofSlope_deg: building.roofSlope_deg,
    framePitch_m: building.framePitch_m,
    w0_kPa: building.w0_kPa,
    Sg_kPa: building.Sg_kPa,
    terrainType: building.terrainType,
    roofStructure: building.roofStructure,
    roofLoad_kPa: initialRoof?.kPa ?? DEFAULT_INPUT.roofLoad_kPa,
    responsibilityCoeff: building.responsibilityCoeff,
  }));
  const [activeSection, setActiveSection] = useState<TrussSection>("VP");
  const [cityQuery, setCityQuery] = useState(building.city);
  const [showCityMatches, setShowCityMatches] = useState(false);
  const [cityMatches, setCityMatches] = useState<SettlementClimateData[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const { setResult } = useBuildingResults();
  const validationErrors = useMemo(
    () => validateBuildingNumericInput({
      span_m: input.span_m,
      length_m: input.length_m,
      height_m: input.height_m,
      framePitch_m: input.framePitch_m,
      w0_kPa: input.w0_kPa,
      Sg_kPa: input.Sg_kPa,
    }),
    [input.span_m, input.length_m, input.height_m, input.framePitch_m, input.w0_kPa, input.Sg_kPa],
  );

  // Auto-recompute on every input change — no «Рассчитать» button needed.
  const { out, error } = useMemo<{ out: TrussOutput | null; error: string | null }>(() => {
    if (validationErrors.length > 0) {
      return { out: null, error: validationErrors[0] };
    }
    try {
      return { out: runTrussCalculation(input), error: null };
    } catch (e) {
      return { out: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, validationErrors]);

  // Publish truss selection into shared results bus for the Summary tab.
  useEffect(() => {
    if (!out) {
      setResult("truss", null);
      return;
    }
    setResult("truss", buildTrussResultPayload({
      input: {
        length_m: input.length_m,
        framePitch_m: input.framePitch_m,
        span_m: input.span_m,
      },
      output: out,
      spanCount: building.spanCount,
      priceC345_rubKg: building.priceC345_rubKg,
    }));
  }, [
    out,
    input.length_m,
    input.framePitch_m,
    input.span_m,
    building.spanCount,
    building.priceC345_rubKg,
    setResult,
  ]);

  const roofLoad = useRoofTotalLoad_kPa();
  useEffect(() => {
    setInput((cur) => ({
      ...cur,
      span_m: building.span_m,
      length_m: building.length_m,
      height_m: building.height_m,
      roofSlope_deg: building.roofSlope_deg,
      framePitch_m: building.framePitch_m,
      w0_kPa: building.w0_kPa,
      Sg_kPa: building.Sg_kPa,
      terrainType: building.terrainType,
      roofStructure: building.roofStructure,
      // Auto-propagation: roof load = panel + purlin self-weight + beam-cell self-weight.
      roofLoad_kPa: roofLoad.total_kPa > 0 ? roofLoad.total_kPa : cur.roofLoad_kPa,
      responsibilityCoeff: building.responsibilityCoeff,
    }));
    setCityQuery(building.city);
  }, [building, roofLoad.total_kPa]);

  const updSynced = <K extends keyof Building>(key: K, value: Building[K]) => {
    setBuilding({ [key]: value } as Partial<Building>);
  };

  useEffect(() => {
    if (!showCityMatches || cityQuery.trim().length < 2) {
      setCityMatches([]);
      setCityLoading(false);
      return;
    }

    let cancelled = false;
    setCityLoading(true);
    const timer = window.setTimeout(() => {
      searchSettlementsAsync(cityQuery)
        .then((matches) => {
          if (!cancelled) {
            setCityMatches(matches.slice(0, 10));
          }
        })
        .catch((error: unknown) => {
          console.error("Failed to search settlements", error);
          if (!cancelled) {
            setCityMatches([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setCityLoading(false);
          }
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cityQuery, showCityMatches]);

  const handleCitySelect = useCallback(async (id: string) => {
    const s = await getSettlementClimateByIdAsync(id);
    if (!s) return;
    const label = `${s.settlement} (${s.region})`;
    setShowCityMatches(false);
    const patch: Partial<Building> = { city: label };
    if (s.terrain.defaultType) patch.terrainType = s.terrain.defaultType as Building["terrainType"];
    if (typeof s.wind.w0Kpa === "number") patch.w0_kPa = s.wind.w0Kpa;
    if (typeof s.snow.sgKpa === "number") patch.Sg_kPa = s.snow.sgKpa;
    setBuilding(patch);
  }, [setBuilding]);



  const upd = (patch: Partial<TrussInput>) =>
    setInput((p) => ({ ...p, ...patch }));

  const updMinThick = (sec: TrussSection, v: number) =>
    setInput((p) => ({ ...p, minThickness_mm: { ...p.minThickness_mm, [sec]: v } }));
  const updMaxWidth = (k: "VP" | "NP", v: number) =>
    setInput((p) => ({ ...p, maxWidth_mm: { ...p.maxWidth_mm, [k]: v } }));
  const updMinWidth = (k: "ORb" | "OR" | "RR", v: number) =>
    setInput((p) => ({ ...p, minWidth_mm: { ...p.minWidth_mm, [k]: v } }));

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 22, marginBottom: 4 }}>Калькулятор стальной фермы покрытия</h1>
      <p className="text-muted text-small" style={{ marginTop: 0 }}>
        Подбор сечений 5 элементов фермы (ВП, НП, ОРб, ОР, РР) по СП 16.13330. Каталог 579 трубных профилей с исключением нестандартных толщин.
      </p>

      <div style={{ marginBottom: 16 }}>
       <Collapsible title="📥 Исходные данные" storageKey="truss-inputs" defaultOpen={true}>
      <div className="grid grid--3" style={{ marginBottom: 16 }}>
        {/* Column 1: geometry */}
        <div className="card" style={{ padding: 12 }}>
          <div className="section-title">Геометрия фермы</div>
          <SyncedNumField label="Пролёт, м (18–30)" value={input.span_m} onChange={(v) => updSynced("span_m", v)} validationKind="positive" />
          <SyncedNumField label="Длина здания, м" value={input.length_m} onChange={(v) => updSynced("length_m", v)} validationKind="positive" />
          <SyncedNumField label="Высота до низа фермы, м" value={input.height_m} onChange={(v) => updSynced("height_m", v)} validationKind="positive" />
          <SyncedNumField label="Уклон кровли, °" value={input.roofSlope_deg} onChange={(v) => updSynced("roofSlope_deg", v)} />
          <SyncedNumField label="Шаг рам, м" value={input.framePitch_m} onChange={(v) => updSynced("framePitch_m", v)} validationKind="positive" />
          <Field
            label="Шаг прогонов, мм (0 = без прогонов)"
            value={input.purlinPitch_mm}
            onChange={(v) => upd({ purlinPitch_mm: v })}
            step={100}
          />
          <SyncedNumField
            label="γₙ (коэф. ответственности)"
            value={input.responsibilityCoeff}
            onChange={(v) => updSynced("responsibilityCoeff", v)}
            step={0.05}
          />
        </div>

        {/* Column 2: loads */}
        <div className="card" style={{ padding: 12 }}>
          <div className="section-title">Климат и нагрузки</div>
          <div className="synced-field" title="Синхронизировано со всеми вкладками">
            <label className="field__label">
              <span className="synced-field__badge">🔗</span>
              Город (автозаполнение w₀, Sg)
            </label>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setShowCityMatches(true);
              }}
              onFocus={() => setShowCityMatches(true)}
              onBlur={() => {
                setBuilding({ city: cityQuery });
                window.setTimeout(() => setShowCityMatches(false), 150);
              }}
              placeholder="Введите название..."
            />
            {cityMatches.length > 0 && (
              <div style={{ border: "1px solid var(--c-border)", maxHeight: 200, overflow: "auto", background: "white" }}>
                {cityMatches.map((s) => (
                  <div
                    key={s.id}
                    style={{ padding: "4px 8px", cursor: "pointer", fontSize: 13 }}
                    onMouseDown={(e) => { e.preventDefault(); handleCitySelect(s.id); }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#eef")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "")}
                  >
                    {s.settlement} — {s.region}{" "}
                    <span className="text-muted">
                      (w₀={s.wind.w0Kpa ?? "—"}, Sg={s.snow.sgKpa ?? "—"})
                    </span>
                  </div>
                ))}
              </div>
            )}
            {cityLoading && (
              <div className="field__hint" style={{ marginTop: 4 }}>
                Поиск...
              </div>
            )}
          </div>
          <SyncedSelectField
            label="Тип местности"
            value={input.terrainType}
            options={[
              ["A", "A — открытая"],
              ["B", "B — город/лес"],
              ["C", "C — плотная застройка"],
            ]}
            onChange={(v) => updSynced("terrainType", v as Building["terrainType"])}
          />
          <SyncedNumField label="w₀ (ветер), кПа" value={input.w0_kPa} onChange={(v) => updSynced("w0_kPa", v)} step={0.01} validationKind="nonNegative" />
          <SyncedNumField label="Sg (снег), кПа" value={input.Sg_kPa} onChange={(v) => updSynced("Sg_kPa", v)} step={0.01} validationKind="nonNegative" />
          <SyncedSelectField
            label="Конструкция покрытия"
            value={input.roofStructure}
            options={STRUCTURES.map((s) => [s.id, `${s.id} (${s.kPa.toFixed(3)} кПа)`])}
            onChange={(v) => updSynced("roofStructure", v)}
          />
          <Field
            label="Нагрузка от кровли, кПа"
            value={input.roofLoad_kPa}
            onChange={(v) => upd({ roofLoad_kPa: v })}
            step={0.01}
          />
          {(roofLoad.purlin_kPa > 0 || roofLoad.beamCell_kPa > 0) && (
            <div className="field__hint" style={{ marginTop: -4, marginBottom: 6 }}>
              🔗 авто: {roofLoad.structure_kPa.toFixed(3)} (покрытие)
              {roofLoad.purlin_kPa > 0 && ` + ${roofLoad.purlin_kPa.toFixed(3)} (прогоны)`}
              {roofLoad.beamCell_kPa > 0 && ` + ${roofLoad.beamCell_kPa.toFixed(3)} (балка покр.)`}
              {" = "}
              <b>{roofLoad.total_kPa.toFixed(3)} кПа</b>
            </div>
          )}
          <Field
            label="Надбавка к нагрузке, %"
            value={input.loadAddition_pct}
            onChange={(v) => upd({ loadAddition_pct: v })}
          />
        </div>

        {/* Column 3: constraints */}
        <div className="card" style={{ padding: 12 }}>
          <div className="section-title">Ограничения сечений</div>
          <Field
            label="Макс. к-т использования"
            value={input.maxUtilization}
            onChange={(v) => upd({ maxUtilization: v })}
            step={0.05}
          />
          <div className="text-small text-muted" style={{ marginTop: 8, marginBottom: 4 }}>Мин. толщина стенки, мм</div>
          <div className="grid grid--2">
            {TRUSS_SECTIONS.map((s) => (
              <Field
                key={s}
                label={`${TRUSS_SECTION_SHORT[s]}`}
                value={input.minThickness_mm[s]}
                onChange={(v) => updMinThick(s, v)}
                step={0.5}
              />
            ))}
          </div>
          <div className="text-small text-muted" style={{ marginTop: 8, marginBottom: 4 }}>
            Макс. ширина пояса, мм
          </div>
          <div className="grid grid--2">
            <Field label="ВП" value={input.maxWidth_mm.VP} onChange={(v) => updMaxWidth("VP", v)} step={10} />
            <Field label="НП" value={input.maxWidth_mm.NP} onChange={(v) => updMaxWidth("NP", v)} step={10} />
          </div>
          <div className="text-small text-muted" style={{ marginTop: 8, marginBottom: 4 }}>
            Мин. ширина раскоса, мм
          </div>
          <div className="grid grid--3">
            <Field label="ОРб" value={input.minWidth_mm.ORb} onChange={(v) => updMinWidth("ORb", v)} step={10} />
            <Field label="ОР" value={input.minWidth_mm.OR} onChange={(v) => updMinWidth("OR", v)} step={10} />
            <Field label="РР" value={input.minWidth_mm.RR} onChange={(v) => updMinWidth("RR", v)} step={10} />
          </div>
        </div>
      </div>
       </Collapsible>
      </div>

      <div style={{ marginBottom: 16 }}>
        <PricesBlock />
      </div>



      {error && (
        <div className="note note--danger" style={{ marginBottom: 16 }}>
          Ошибка: {error}
        </div>
      )}

      {out && (
        <div>
          <div className="note note--warn" style={{ marginBottom: 12 }}>
            Внимание: горизонтальная реакция H в ферменном Excel-oracle не найдена и сейчас не передаётся в расчёт колонн как число. Для колонн это открытый инженерный вопрос, а не подтверждённое H = 0.
          </div>

          {/* Sticky summary */}
          <div style={{ display: "flex", gap: 16, padding: "12px 16px", background: "#f1f5f9", borderRadius: 6, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Stat label="Общая масса фермы, кг" value={out.totalMass_kg.toFixed(1)} />
            <Stat label="Удельная масса, кг/м²" value={out.unitMass_kg_per_m2.toFixed(2)} />
            <Stat label="Снег, кН/м" value={out.loads.snow_kN_per_m.toFixed(2)} />
            <Stat label="Ветер, кН/м" value={out.loads.wind_kN_per_m.toFixed(2)} />
            <Stat label="Кровля, кН/м" value={out.loads.roof_kN_per_m.toFixed(2)} />
          </div>

          {out.warnings.length > 0 && (
            <div className="note note--warn" style={{ marginBottom: 12 }}>
              {out.warnings.map((w, i) => (
                <div key={i}>⚠ {w}</div>
              ))}
            </div>
          )}

          {/* 5 cards summary */}
          <div className="grid grid--5" style={{ marginBottom: 16 }}>
            {TRUSS_SECTIONS.map((sec) => {
              const r = out.sections[sec];
              const sel = r.selected;
              const isActive = activeSection === sec;
              return (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className="btn"
                  style={{
                    background: isActive ? "#0369a1" : "white",
                    color: isActive ? "white" : "#0f172a",
                    borderColor: isActive ? "#0369a1" : undefined,
                    textAlign: "left",
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{TRUSS_SECTION_LABELS[sec]}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{TRUSS_SECTION_SHORT[sec]}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    {sel ? sel.profile.name : <span className="text-danger">не подобрано</span>}
                  </div>
                  {sel && (
                    <div style={{ fontSize: 11, marginTop: 2, opacity: 0.85 }}>
                      {sel.totalMass_kg.toFixed(0)} кг · K={sel.maxUtilization.toFixed(2)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail of active section */}
          <SectionDetail result={out.sections[activeSection]} />
        </div>
      )}
    </div>
  );
}

function SectionDetail({
  result,
}: {
  result: TrussOutput["sections"][TrussSection];
}) {
  const sec = result.section;
  const f = result.forces;
  const checkNames =
    result.candidates.length > 0 ? Object.keys(result.candidates[0].checks) : [];

  return (
    <div>
      <h2 className="section-title" style={{ fontSize: 16, marginBottom: 8 }}>
        {TRUSS_SECTION_LABELS[sec]} ({TRUSS_SECTION_SHORT[sec]}) — детали
      </h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap", fontSize: 13 }}>
        <span><b>N</b> = {f.N_kN.toFixed(1)} кН</span>
        {sec === "VP" && (
          <>
            <span><b>M</b> = {f.M_kNm.toFixed(2)} кН·м</span>
            <span><b>Q</b> = {f.Q_kN.toFixed(1)} кН</span>
          </>
        )}
        {(sec === "ORb" || sec === "OR" || sec === "RR") && (
          <>
            <span><b>N+</b> = {(f.Np_kN ?? 0).toFixed(1)} кН</span>
            <span><b>N−</b> = {(f.Nm_kN ?? 0).toFixed(1)} кН</span>
          </>
        )}
        <span><b>lefx</b> = {result.lefx_m.toFixed(2)} м</span>
        <span><b>lefy</b> = {result.lefy_m.toFixed(2)} м</span>
        <span><b>длина элемента</b> = {result.member_length_m.toFixed(2)} м</span>
      </div>

      {result.candidates.length === 0 ? (
        <div className="note note--danger">
          Нет проходящих профилей. Попробуйте увеличить макс. ширину или снизить ограничения.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Профиль</th>
                <th>Ry, МПа</th>
                <th>λx</th>
                <th>λy</th>
                {checkNames.map((n) => (
                  <th key={n}>{n}</th>
                ))}
                <th>K макс</th>
                <th>Лимит</th>
                <th>Масса, кг</th>
              </tr>
            </thead>
            <tbody>
              {result.candidates.map((c, i) => (
                <tr
                  key={c.profile.name + i}
                  style={{
                    background: i === 0 ? "#dcfce7" : c.maxUtilization > 0.95 ? "#fef2f2" : undefined,
                  }}
                >
                  <td className="num">{i + 1}</td>
                  <td style={{ fontWeight: i === 0 ? 600 : 400 }}>{c.profile.name}</td>
                  <td className="num">{c.Ry_MPa.toFixed(0)}</td>
                  <td className="num">{c.lambda_x.toFixed(0)}</td>
                  <td className="num">{c.lambda_y.toFixed(0)}</td>
                  {checkNames.map((n) => (
                    <td key={n} className="num">
                      {(c.checks[n] ?? 0).toFixed(3)}
                    </td>
                  ))}
                  <td className="num" style={{ fontWeight: 600 }}>{c.maxUtilization.toFixed(3)}</td>
                  <td>{c.limitingCheck}</td>
                  <td className="num">{c.totalMass_kg.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
    </div>
  );
}
