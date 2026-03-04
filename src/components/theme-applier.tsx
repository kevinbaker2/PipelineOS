"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/theme-provider";

export function ThemeApplier({ theme }: { theme: string }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
}
