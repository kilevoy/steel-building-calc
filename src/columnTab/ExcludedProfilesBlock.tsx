import profilesJson from "../data/profiles/profiles.json";
import type { ProfileData } from "../calc/types";
import { DEFAULT_EXCLUDED_PROFILES } from "../calc/nonStandardProfiles";
import { useBuilding } from "../building/useBuilding";
import { Collapsible } from "../building/Collapsible";

const PROFILES = profilesJson as ProfileData[];

const CATEGORY_LABELS: Record<ProfileData["category"], string> = {
  beam_normal: "Двутавр нормальный (Б)",
  beam_wide: "Двутавр широкополочный (Ш)",
  beam_column: "Двутавр колонный (К)",
  square_tube: "Труба квадратная (кв.)",
  rect_tube: "Труба прямоугольная (пр.)",
  channel_parallel: "Швеллер",
};

const CATEGORY_ORDER: ProfileData["category"][] = [
  "beam_normal",
  "beam_wide",
  "beam_column",
  "square_tube",
  "rect_tube",
  "channel_parallel",
];

/**
 * Список профилей, исключённых из подбора колонны — по умолчанию
 * повторяет «исключалку» исходного Excel (неходовые типоразмеры), но
 * пользователь может сам добавить или вернуть любой профиль. Хранится в
 * общем `Building`, так что переживает переключение вкладок и
 * сохраняется вместе с проектом.
 */
export function ExcludedProfilesBlock() {
  const { building, setBuilding } = useBuilding();
  const excluded = new Set(building.excludedProfileNames);

  const toggle = (name: string, exclude: boolean) => {
    const next = new Set(building.excludedProfileNames);
    if (exclude) next.add(name);
    else next.delete(name);
    setBuilding({ excludedProfileNames: Array.from(next) });
  };

  const resetToDefault = () => setBuilding({ excludedProfileNames: DEFAULT_EXCLUDED_PROFILES });

  return (
    <Collapsible
      title="🚫 Исключённые профили"
      storageKey="excluded-profiles"
      defaultOpen={false}
      rightHeader={
        <span>
          {excluded.size} из {PROFILES.length} исключено
        </span>
      }
    >
      <div className="text-small text-muted" style={{ marginBottom: 8 }}>
        По умолчанию — неходовые типоразмеры, исключённые в исходном Excel
        («исключалка»). Отметьте, чтобы исключить профиль из подбора, снимите
        отметку, чтобы разрешить.
        <button type="button" className="btn" style={{ marginLeft: 8 }} onClick={resetToDefault}>
          Сбросить к дефолту
        </button>
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--c-border-soft)", borderRadius: 6, padding: 8 }}>
        {CATEGORY_ORDER.map((cat) => {
          const items = PROFILES.filter((p) => p.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div className="text-small" style={{ fontWeight: 600, marginBottom: 4 }}>
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="grid grid--4">
                {items.map((p) => (
                  <label key={p.name} className="check text-small">
                    <input
                      type="checkbox"
                      checked={excluded.has(p.name)}
                      onChange={(e) => toggle(p.name, e.target.checked)}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Collapsible>
  );
}
