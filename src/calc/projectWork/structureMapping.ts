import type { ProjectWorkInputs, RoofingMaterial, WallMaterial } from "./types";

/**
 * Мапинг конструкций основного калькулятора («Конструкция покрытия» и
 * «Конструкция ограждения», справочник src/data/structures) в коды
 * материалов книги ИНСИ (EXCEL-011).
 *
 * Согласовано с пользователем 2026-06-13 (по форме ИНСИ):
 *   стены  — профлист / сэндвич послойной сборки / сэндвич заводской;
 *   кровля — профлист / сэндвич послойной / сэндвич заводской / ПВХ
 *            (коды AM31 = 1 / 2 / 3 / 4).
 *
 * Мапинг конструкций:
 *   - профлист              → профлист (стены 1, кровля 1);
 *   - «наше N мм» (и с ГВЛ) → послойная сборка (стены 2, кровля 2), толщина по N;
 *   - «С-П N мм»            → заводской сэндвич (стены 3, кровля 3), толщина по N;
 *   - «малоуклонная кровля» → ПВХ (кровля 4).
 *
 * Толщина-индекс книги: 1→100, 2→150, 3→200, 4→250 мм. На коэффициент
 * стен она влияет только для послойной сборки; для профлиста и заводского
 * сэндвича толщина в формуле книги не участвует.
 */

function thicknessIndex(structureId: string): number {
  const mm = Number(structureId.match(/(\d+)\s*мм/)?.[1] ?? "0");
  if (mm <= 100) return 1;
  if (mm <= 150) return 2;
  if (mm <= 200) return 3;
  return 4;
}

export interface WallBookValues {
  material: WallMaterial;
  thickness: number;
}

/** Конструкция ограждения → материал стен + толщина (коды книги). */
export function wallStructureToBook(structureId: string): WallBookValues {
  const id = structureId.trim();
  if (id.startsWith("наше")) return { material: 2, thickness: thicknessIndex(id) }; // послойная сборка
  if (id.startsWith("С-П")) return { material: 3, thickness: thicknessIndex(id) };   // заводской сэндвич
  return { material: 1, thickness: 2 }; // профлист и прочее
}

/**
 * Конструкция покрытия → материал кровли книги ИНСИ:
 * 1=профлист, 2=сэндвич послойной, 3=сэндвич заводской, 4=ПВХ.
 */
export function roofStructureToBook(structureId: string): RoofingMaterial {
  const id = structureId.trim();
  if (id.startsWith("наше")) return 2; // послойная сборка
  if (id.startsWith("С-П")) return 3; // заводской сэндвич
  if (id.startsWith("малоуклонная")) return 4; // ПВХ
  return 1; // профлист
}

/** Удобный комбайн для движка: накладывает материалы из конструкций. */
export function applyStructuresToInputs(
  inputs: ProjectWorkInputs,
  roofStructure: string,
  wallStructure: string,
): ProjectWorkInputs {
  const wall = wallStructureToBook(wallStructure);
  return {
    ...inputs,
    wallMaterial: wall.material,
    wallThickness: wall.thickness,
    roofingMaterial: roofStructureToBook(roofStructure),
  };
}
