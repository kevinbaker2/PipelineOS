"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { generateWildcardPalette, THEME_CSS_VARS } from "@/lib/themes";

interface ThemeContextValue {
  theme: string;
  resolvedTheme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "obsidian",
  resolvedTheme: "obsidian",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: string;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState(initialTheme);

  const setTheme = useCallback((t: string) => {
    setThemeState(t);
  }, []);

  useEffect(() => {
    const el = document.documentElement;

    // Always clean up inline wildcard vars first
    THEME_CSS_VARS.forEach((v) => el.style.removeProperty(v));

    if (theme === "wildcard") {
      delete el.dataset.theme;
      const palette = generateWildcardPalette();
      Object.entries(palette.vars).forEach(([key, value]) => {
        el.style.setProperty(key, value);
      });
    } else if (theme === "obsidian") {
      delete el.dataset.theme;
    } else {
      el.dataset.theme = theme;
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
