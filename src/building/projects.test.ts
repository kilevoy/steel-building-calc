import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDING } from "./buildingContext";
import {
  deleteProject,
  exportProjectFile,
  listProjects,
  loadProject,
  parseProjectFile,
  saveProject,
  type StorageLike,
} from "./projects";

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

describe("projects storage", () => {
  it("пустое хранилище — пустой список", () => {
    expect(listProjects(memoryStorage())).toEqual([]);
  });

  it("сохраняет и загружает проект", () => {
    const s = memoryStorage();
    const building = { ...DEFAULT_BUILDING, span_m: 30, city: "Барнаул" };
    saveProject("Цех 30м", building, s, new Date("2026-06-12T10:00:00Z"));
    const list = listProjects(s);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Цех 30м");
    expect(list[0].savedAt).toBe("2026-06-12T10:00:00.000Z");
    expect(loadProject("Цех 30м", s)).toMatchObject({ span_m: 30, city: "Барнаул" });
  });

  it("повторное сохранение под тем же именем перезаписывает", () => {
    const s = memoryStorage();
    saveProject("A", { ...DEFAULT_BUILDING, span_m: 18 }, s);
    saveProject("A", { ...DEFAULT_BUILDING, span_m: 24 }, s);
    expect(listProjects(s)).toHaveLength(1);
    expect(loadProject("A", s)?.span_m).toBe(24);
  });

  it("последний сохранённый — первый в списке", () => {
    const s = memoryStorage();
    saveProject("старый", DEFAULT_BUILDING, s);
    saveProject("новый", DEFAULT_BUILDING, s);
    expect(listProjects(s).map((p) => p.name)).toEqual(["новый", "старый"]);
  });

  it("удаляет проект", () => {
    const s = memoryStorage();
    saveProject("A", DEFAULT_BUILDING, s);
    saveProject("B", DEFAULT_BUILDING, s);
    deleteProject("A", s);
    expect(listProjects(s).map((p) => p.name)).toEqual(["B"]);
    expect(loadProject("A", s)).toBeNull();
  });

  it("пустое имя не сохраняется", () => {
    const s = memoryStorage();
    saveProject("   ", DEFAULT_BUILDING, s);
    expect(listProjects(s)).toEqual([]);
  });

  it("повреждённый JSON в хранилище не роняет список", () => {
    const s = memoryStorage();
    s.setItem("colonna:projects:v1", "{broken");
    expect(listProjects(s)).toEqual([]);
  });

  it("старый снимок без новых полей дополняется дефолтами", () => {
    const s = memoryStorage();
    s.setItem(
      "colonna:projects:v1",
      JSON.stringify([{ name: "Legacy", savedAt: "", building: { span_m: 21 } }]),
    );
    const b = loadProject("Legacy", s);
    expect(b?.span_m).toBe(21);
    expect(b?.purlinSelectionMode).toBe(DEFAULT_BUILDING.purlinSelectionMode);
  });
});

describe("export / import файла проекта", () => {
  it("экспорт → импорт восстанавливает здание и имя", () => {
    const building = { ...DEFAULT_BUILDING, length_m: 96 };
    const text = exportProjectFile("Склад 96м", building);
    const parsed = parseProjectFile(text);
    expect(parsed.name).toBe("Склад 96м");
    expect(parsed.building.length_m).toBe(96);
  });

  it("принимает голый объект Building", () => {
    const parsed = parseProjectFile(JSON.stringify({ ...DEFAULT_BUILDING, span_m: 36 }));
    expect(parsed.building.span_m).toBe(36);
    expect(parsed.name).toBe("");
  });

  it("отклоняет не-JSON и JSON без параметров здания", () => {
    expect(() => parseProjectFile("не json")).toThrow(/JSON/);
    expect(() => parseProjectFile('{"foo": 1}')).toThrow(/span_m/);
  });
});
