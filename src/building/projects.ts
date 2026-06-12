import { DEFAULT_BUILDING, type Building } from "./buildingContext";

/**
 * Именованные проекты зданий: сохранение/загрузка снимков общего
 * `Building` в localStorage и экспорт/импорт в JSON-файл.
 *
 * Чистые функции принимают Storage-совместимое хранилище, чтобы их
 * можно было тестировать без браузера.
 */

export interface SavedProject {
  name: string;
  savedAt: string; // ISO-8601
  building: Building;
}

const PROJECTS_KEY = "colonna:projects:v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

/** Накладывает снимок на дефолты: старые проекты переживают добавление полей. */
function normalizeBuilding(raw: unknown): Building {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_BUILDING };
  return { ...DEFAULT_BUILDING, ...(raw as Partial<Building>) };
}

export function listProjects(storage: StorageLike | null = defaultStorage()): SavedProject[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (p): p is SavedProject =>
          typeof p === "object" && p !== null &&
          typeof (p as SavedProject).name === "string" &&
          (p as SavedProject).name.length > 0,
      )
      .map((p) => ({
        name: p.name,
        savedAt: typeof p.savedAt === "string" ? p.savedAt : "",
        building: normalizeBuilding(p.building),
      }));
  } catch {
    return [];
  }
}

function writeProjects(projects: SavedProject[], storage: StorageLike): void {
  try {
    storage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    /* ignore quota errors */
  }
}

/** Сохраняет проект; существующее имя перезаписывается. */
export function saveProject(
  name: string,
  building: Building,
  storage: StorageLike | null = defaultStorage(),
  now: Date = new Date(),
): SavedProject[] {
  const trimmed = name.trim();
  if (!trimmed || !storage) return listProjects(storage);
  const next = listProjects(storage).filter((p) => p.name !== trimmed);
  next.unshift({ name: trimmed, savedAt: now.toISOString(), building: { ...building } });
  writeProjects(next, storage);
  return next;
}

export function loadProject(
  name: string,
  storage: StorageLike | null = defaultStorage(),
): Building | null {
  const found = listProjects(storage).find((p) => p.name === name);
  return found ? { ...found.building } : null;
}

export function deleteProject(
  name: string,
  storage: StorageLike | null = defaultStorage(),
): SavedProject[] {
  if (!storage) return [];
  const next = listProjects(storage).filter((p) => p.name !== name);
  writeProjects(next, storage);
  return next;
}

/** Сериализует текущее здание в содержимое .json-файла. */
export function exportProjectFile(name: string, building: Building): string {
  return JSON.stringify(
    { format: "steel-building-calc:project", version: 1, name, building },
    null,
    2,
  );
}

/**
 * Разбирает содержимое .json-файла проекта. Принимает как полный формат
 * экспорта, так и «голый» объект Building. Бросает Error с понятным
 * сообщением, если файл не похож на проект.
 */
export function parseProjectFile(text: string): { name: string; building: Building } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Файл не является корректным JSON");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Файл не содержит проект здания");
  }
  const obj = parsed as Record<string, unknown>;
  const source = typeof obj.building === "object" && obj.building !== null ? obj.building : obj;
  if (typeof (source as Partial<Building>).span_m !== "number") {
    throw new Error("Файл не содержит параметры здания (нет поля span_m)");
  }
  return {
    name: typeof obj.name === "string" ? obj.name : "",
    building: normalizeBuilding(source),
  };
}
