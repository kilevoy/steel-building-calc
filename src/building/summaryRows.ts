import type { BuildingResults, ResultItem } from "./resultsContext";

export interface SummaryRow {
  label: string;
  profile: string;
  steel: string;
  count: string;
  lengthPerPiece_m: string;
  totalLength_m: string;
  unitMass_kg: string;
  totalMass_kg: number;
  cost_rub: number;
  note?: string;
}

export function formatSummaryMass(v: number): string {
  if (!Number.isFinite(v)) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(2)} т`;
  return `${v.toFixed(1)} кг`;
}

export function formatSummaryCost(v: number): string {
  if (!Number.isFinite(v) || v === 0) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} млн ₽`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(2)} тыс. ₽`;
  return `${v.toFixed(0)} ₽`;
}

function rowFromItem(label: string, item: ResultItem | null, note?: string): SummaryRow | null {
  if (!item) return null;
  const count = item.count ?? 1;
  const unit = item.massPerPiece_kg ?? item.totalMass_kg / Math.max(1, count);
  return {
    label,
    profile: item.profile,
    steel: item.steel,
    count: count > 1 ? `${count}` : "—",
    lengthPerPiece_m: item.lengthPerPiece_m ? `${item.lengthPerPiece_m.toFixed(2)} м` : "—",
    totalLength_m: item.totalLength_m ? `${item.totalLength_m.toFixed(2)} м` : "—",
    unitMass_kg: count > 1 ? formatSummaryMass(unit) : "—",
    totalMass_kg: item.totalMass_kg,
    cost_rub: item.cost_rub,
    note: note ?? item.note,
  };
}

function pushItemRows(rows: SummaryRow[], label: string, item: ResultItem | null): void {
  const breakdown = item?.breakdown ?? [];
  if (breakdown.length > 0) {
    for (const breakdownItem of breakdown) {
      const row = rowFromItem(label, breakdownItem);
      if (row) rows.push(row);
    }
    return;
  }

  const row = rowFromItem(label, item);
  if (row) rows.push(row);
}

export function buildSummaryRows(results: BuildingResults): SummaryRow[] {
  const rows: SummaryRow[] = [];

  if (results.column) {
    pushItemRows(rows, "Колонна крайняя", results.column.edge);
    pushItemRows(rows, "Колонна средняя", results.column.middle);
    pushItemRows(rows, "Колонна фахверк", results.column.fachwerk);
  }

  if (results.truss) {
    rows.push({
      label: "Ферма покрытия",
      profile: results.truss.sections.map((s) => `${s.section}: ${s.profile}`).join(" / "),
      steel: results.truss.sections[0]?.steel ?? "—",
      count: `${results.truss.n_trusses}`,
      lengthPerPiece_m: results.truss.lengthPerPiece_m
        ? `${results.truss.lengthPerPiece_m.toFixed(2)} м`
        : "—",
      totalLength_m: results.truss.totalLength_m
        ? `${results.truss.totalLength_m.toFixed(2)} м`
        : "—",
      unitMass_kg: formatSummaryMass(results.truss.totalMass_kg / results.truss.n_trusses),
      totalMass_kg: results.truss.totalMass_kg,
      cost_rub: results.truss.totalCost_rub,
      note: `внутренние рамы, ${results.truss.unitMass_kg_per_m2.toFixed(1)} кг/м²`,
    });
  }

  const purlinSteel = results.purlin?.steel ?? "";
  const purlinLabel = purlinSteel.startsWith("МП") || purlinSteel.startsWith("MP")
    ? "Прогоны (ЛСТК)"
    : "Прогоны (прокат)";
  const purlin = rowFromItem(purlinLabel, results.purlin);
  if (purlin) rows.push(purlin);

  const beamCell = rowFromItem("Торцевая балка покрытия", results.beamCell);
  if (beamCell) rows.push(beamCell);

  const windowRiegel = rowFromItem(
    "Оконные ригели (★ top‑1)",
    results.windowRiegel,
    "Масса 1 ригеля; кол-во не учитывается",
  );
  if (windowRiegel) rows.push(windowRiegel);

  const craneBeam = rowFromItem(
    "Подкрановая балка",
    results.craneBeam,
    "Масса 1 балки; кол-во не учитывается",
  );
  if (craneBeam) rows.push(craneBeam);

  return rows;
}
