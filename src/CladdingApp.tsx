import { useState } from "react";
import { SyncedNumField, SyncedSelectField } from "./building/SyncedField";
import { useBuilding, type Building } from "./building/useBuilding";
import { Field } from "./components/form";
import {
  calculateCladding,
  type CladdingInput,
  type CladdingResult,
} from "./calc/cladding/engine";

interface CladdingOptions {
  eavesOverhang_m: number;
  gableOverhang_m: number;
  wallOpenings_m2: number;
  roofOpenings_m2: number;
  reserve_percent: number;
}

const DEFAULT_OPTIONS: CladdingOptions = {
  eavesOverhang_m: 0,
  gableOverhang_m: 0,
  wallOpenings_m2: 0,
  roofOpenings_m2: 0,
  reserve_percent: 10,
};

function formatArea(value: number): string {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatLength(value: number): string {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ResultRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <tr className={strong ? "total-row" : undefined}>
      <td>{label}</td>
      <td className="num">{formatArea(value)} м²</td>
    </tr>
  );
}

export function CladdingApp() {
  const { building, setBuilding } = useBuilding();
  const [options, setOptions] = useState<CladdingOptions>(DEFAULT_OPTIONS);

  const setBuildingValue = <K extends keyof Building>(key: K, value: Building[K]) =>
    setBuilding({ [key]: value } as Partial<Building>);
  const setOption = <K extends keyof CladdingOptions>(key: K, value: CladdingOptions[K]) =>
    setOptions((current) => ({ ...current, [key]: value }));

  const calculation: { result: CladdingResult | null; error: string | null } = (() => {
    const input: CladdingInput = {
      span_m: building.span_m,
      length_m: building.length_m,
      eavesHeight_m: building.height_m,
      roofSlope_deg: building.roofSlope_deg,
      roofShape: building.roofShape,
      ...options,
    };
    try {
      return { result: calculateCladding(input), error: null };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "Не удалось рассчитать площадь облицовки.",
      };
    }
  })();

  return (
    <div>
      <h2 className="page-title">Облицовки здания</h2>
      <p className="text-muted text-small" style={{ marginTop: 0 }}>
        Предварительный подсчёт площади кровельной и стеновой облицовки. Геометрия со
        значком 🔗 синхронизирована с остальными вкладками.
      </p>

      <div className="grid grid--2 cladding-layout">
        <fieldset>
          <legend>Геометрия здания</legend>
          <div className="grid grid--2">
            <SyncedNumField
              label="Ширина здания, м"
              value={building.span_m}
              step={0.1}
              onChange={(value) => setBuildingValue("span_m", value)}
              validationKind="positive"
            />
            <SyncedNumField
              label="Длина здания, м"
              value={building.length_m}
              step={0.1}
              onChange={(value) => setBuildingValue("length_m", value)}
              validationKind="positive"
            />
            <SyncedNumField
              label="Высота до карниза, м"
              value={building.height_m}
              step={0.1}
              onChange={(value) => setBuildingValue("height_m", value)}
              validationKind="positive"
            />
            <SyncedNumField
              label="Уклон кровли, °"
              value={building.roofSlope_deg}
              step={0.1}
              onChange={(value) => setBuildingValue("roofSlope_deg", value)}
              validationKind="nonNegative"
            />
            <SyncedSelectField
              label="Форма кровли"
              value={building.roofShape}
              options={[["gable", "Двускатная"], ["monoslope", "Односкатная"]]}
              onChange={(value) => setBuildingValue("roofShape", value as Building["roofShape"])}
            />
          </div>
        </fieldset>

        <fieldset>
          <legend>Свесы, проёмы и запас</legend>
          <div className="grid grid--2">
            <Field
              label="Карнизный свес, м"
              value={options.eavesOverhang_m}
              step={0.05}
              onChange={(value) => setOption("eavesOverhang_m", value)}
            />
            <Field
              label="Торцевой свес, м"
              value={options.gableOverhang_m}
              step={0.05}
              onChange={(value) => setOption("gableOverhang_m", value)}
            />
            <Field
              label="Проёмы в стенах, м²"
              value={options.wallOpenings_m2}
              step={0.1}
              onChange={(value) => setOption("wallOpenings_m2", value)}
            />
            <Field
              label="Проёмы в кровле, м²"
              value={options.roofOpenings_m2}
              step={0.1}
              onChange={(value) => setOption("roofOpenings_m2", value)}
            />
            <Field
              label="Запас на нахлёсты и подрезку, %"
              value={options.reserve_percent}
              step={0.5}
              onChange={(value) => setOption("reserve_percent", value)}
            />
          </div>
          <p className="field__hint">
            Свесы задаются в горизонтальной проекции. Проёмы вводятся суммарной площадью.
          </p>
        </fieldset>
      </div>

      {calculation.error && (
        <div className="note note--danger" style={{ marginTop: 12 }}>
          {calculation.error}
        </div>
      )}

      {calculation.result && (
        <CladdingResults
          result={calculation.result}
          reservePercent={options.reserve_percent}
          roofStructure={building.roofStructure}
          wallStructure={building.wallStructure}
          roofShape={building.roofShape}
        />
      )}
    </div>
  );
}

function CladdingResults({
  result,
  reservePercent,
  roofStructure,
  wallStructure,
  roofShape,
}: {
  result: CladdingResult;
  reservePercent: number;
  roofStructure: string;
  wallStructure: string;
  roofShape: Building["roofShape"];
}) {
  return (
    <>
      <div className="grid grid--3 cladding-metrics">
        <div className="card cladding-metric">
          <span className="stat__label">Кровля к заказу</span>
          <strong className="stat__value">{formatArea(result.roofOrder_m2)} м²</strong>
          <span className="text-small text-muted">{roofStructure}</span>
        </div>
        <div className="card cladding-metric">
          <span className="stat__label">Стены к заказу</span>
          <strong className="stat__value">{formatArea(result.wallsOrder_m2)} м²</strong>
          <span className="text-small text-muted">{wallStructure}</span>
        </div>
        <div className="card cladding-metric cladding-metric--total">
          <span className="stat__label">Всего к заказу</span>
          <strong className="stat__value">{formatArea(result.totalOrder_m2)} м²</strong>
          <span className="text-small text-muted">с запасом {reservePercent}%</span>
        </div>
      </div>

      <div className="grid grid--2 cladding-results">
        <fieldset>
          <legend>Кровля</legend>
          <div className="text-small text-muted cladding-geometry-note">
            Подъём: <b>{formatLength(result.roofRise_m)} м</b>; длина ската: <b>{formatLength(result.roofSlopeLength_m)} м</b>.
          </div>
          <div className="table-wrap cladding-table">
            <table className="table">
              <tbody>
                <ResultRow label="Площадь с учётом свесов" value={result.roofGross_m2} />
                <ResultRow label="После вычета проёмов" value={result.roofNet_m2} />
                <ResultRow label={`К заказу с запасом ${reservePercent}%`} value={result.roofOrder_m2} strong />
              </tbody>
            </table>
          </div>
        </fieldset>

        <fieldset>
          <legend>Стены</legend>
          <div className="table-wrap cladding-table">
            <table className="table">
              <tbody>
                <ResultRow label="Продольные стены" value={result.longitudinalWallsGross_m2} />
                <ResultRow label="Прямоугольные части торцов" value={result.endWallRectanglesGross_m2} />
                <ResultRow
                  label={roofShape === "gable" ? "Фронтоны" : "Верхние треугольные части торцов"}
                  value={result.upperEndWallsGross_m2}
                />
                <ResultRow label="Стены до вычета проёмов" value={result.wallsGross_m2} />
                <ResultRow label="После вычета проёмов" value={result.wallsNet_m2} />
                <ResultRow label={`К заказу с запасом ${reservePercent}%`} value={result.wallsOrder_m2} strong />
              </tbody>
            </table>
          </div>
        </fieldset>
      </div>

      <div className="note note--info cladding-note">
        Результат предназначен для предварительной ведомости площадей. Он не учитывает
        раскладку листов, полезную ширину профиля, направление монтажа, доборные элементы и
        индивидуальные нахлёсты — для заказа их нужно проверить отдельно.
      </div>
    </>
  );
}
