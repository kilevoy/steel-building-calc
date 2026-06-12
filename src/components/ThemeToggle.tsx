import { useEffect, useState } from "react";

const THEME_KEY = "colonna:theme";

type Theme = "light" | "dark";

function initialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  // main.tsx уже выставил data-theme до первого рендера — читаем его,
  // чтобы кнопка и документ не разошлись.
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Переключатель светлой/тёмной темы; выбор хранится в localStorage. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return (
    <button
      type="button"
      className="btn"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
      aria-label="Переключить тему"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
