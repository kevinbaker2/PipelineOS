"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { resolveTheme } from "@/lib/themes";

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
  const resolved = resolveTheme(theme);

  const setTheme = useCallback((t: string) => {
    setThemeState(t);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    if (resolved === "obsidian") {
      delete el.dataset.theme;
    } else {
      el.dataset.theme = resolved;
    }
  }, [resolved]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
