import { create } from "zustand";

type Theme = "light" | "dark";

function initial(): Theme {
  const saved = localStorage.getItem("theme") as Theme | null;
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set, get) => {
  const theme = initial();
  apply(theme);
  return {
    theme,
    toggle() {
      const next: Theme = get().theme === "dark" ? "light" : "dark";
      apply(next);
      set({ theme: next });
    },
  };
});
