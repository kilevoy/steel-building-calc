import { useRef, useState } from "react";
import { useBuilding } from "../building/useBuilding";
import {
  deleteProject,
  exportProjectFile,
  listProjects,
  loadProject,
  parseProjectFile,
  saveProject,
  type SavedProject,
} from "../building/projects";

function formatSavedAt(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Меню именованных проектов: сохранить текущее здание под именем,
 * загрузить/удалить сохранённый, экспорт и импорт .json-файла.
 * Проекты хранят только общий `Building`; результаты вкладок
 * пересчитываются автоматически после загрузки.
 */
export function ProjectsMenu() {
  const { building, setBuilding } = useBuilding();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>(() => listProjects());
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setProjects(listProjects());

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setMessage("Введите имя проекта");
      return;
    }
    setProjects(saveProject(trimmed, building));
    setMessage(`Сохранено: «${trimmed}»`);
  };

  const handleLoad = (projectName: string) => {
    const loaded = loadProject(projectName);
    if (!loaded) {
      setMessage(`Проект «${projectName}» не найден`);
      refresh();
      return;
    }
    setBuilding(loaded);
    setName(projectName);
    setMessage(`Загружено: «${projectName}» — все вкладки пересчитаются автоматически`);
  };

  const handleDelete = (projectName: string) => {
    if (!window.confirm(`Удалить проект «${projectName}»?`)) return;
    setProjects(deleteProject(projectName));
    setMessage(`Удалено: «${projectName}»`);
  };

  const handleExport = () => {
    const exportName = name.trim() || "проект";
    const blob = new Blob([exportProjectFile(exportName, building)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName}.steel-calc.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const parsed = parseProjectFile(await file.text());
      setBuilding(parsed.building);
      if (parsed.name) {
        setName(parsed.name);
        setProjects(saveProject(parsed.name, parsed.building));
        setMessage(`Импортировано и сохранено: «${parsed.name}»`);
      } else {
        setMessage("Импортировано: параметры здания применены");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div className="projects-menu no-print">
      <button
        type="button"
        className="btn"
        onClick={() => setOpen((v) => !v)}
        title="Сохранение и загрузка именованных проектов здания"
      >
        📁 Проекты{projects.length > 0 ? ` (${projects.length})` : ""}
      </button>
      {open && (
        <div className="projects-menu__panel card">
          <div className="projects-menu__row">
            <input
              type="text"
              placeholder="Имя проекта, напр. «Цех 24×72»"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            <button type="button" className="btn btn--primary" onClick={handleSave}>
              Сохранить
            </button>
          </div>
          <div className="projects-menu__row">
            <button type="button" className="btn" onClick={handleExport}>
              ⬇ Экспорт в файл
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fileInputRef.current?.click()}
            >
              ⬆ Импорт из файла
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
                e.target.value = "";
              }}
            />
          </div>
          {message && <div className="field__hint">{message}</div>}
          {projects.length === 0 ? (
            <div className="text-muted text-small">
              Сохранённых проектов пока нет. Проект хранит все общие параметры
              здания (геометрия, климат, цены) в этом браузере.
            </div>
          ) : (
            <ul className="projects-menu__list">
              {projects.map((p) => (
                <li key={p.name} className="projects-menu__item">
                  <button
                    type="button"
                    className="projects-menu__load"
                    title="Загрузить проект"
                    onClick={() => handleLoad(p.name)}
                  >
                    {p.name}
                    {p.savedAt && (
                      <span className="text-muted text-small"> · {formatSavedAt(p.savedAt)}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn projects-menu__delete"
                    title="Удалить проект"
                    onClick={() => handleDelete(p.name)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
