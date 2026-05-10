import { createContext, useContext, useState, ReactNode } from "react";

export type BunkerTheme = "dark" | "techgray";

export const THEME_BG: Record<BunkerTheme, string> = {
  dark:     "#050508",
  techgray: "#0d1117",
};

interface ThemeCtxValue {
  theme:    BunkerTheme;
  bg:       string;
  setTheme: (t: BunkerTheme) => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({
  theme:    "dark",
  bg:       "#050508",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, _set] = useState<BunkerTheme>(
    () => (localStorage.getItem("bunker_theme") as BunkerTheme) ?? "dark"
  );

  const setTheme = (t: BunkerTheme) => {
    _set(t);
    localStorage.setItem("bunker_theme", t);
  };

  return (
    <ThemeCtx.Provider value={{ theme, bg: THEME_BG[theme], setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
