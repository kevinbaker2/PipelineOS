"use client";

import { useState } from "react";
import { Check, Dices } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES, getWildcardLabel } from "@/lib/themes";
import { useTheme } from "@/components/theme-provider";
import { updateTheme } from "@/actions/settings";
import { Card } from "@/components/ui/card";

export function AppearanceSettings({ currentTheme }: { currentTheme: string }) {
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState<string | null>(null);
  const activeTheme = theme || currentTheme;
  const wildcardLabel = getWildcardLabel(activeTheme);

  async function handleSelect(id: string) {
    if (id === activeTheme) return;
    setSaving(id);
    setTheme(id);
    await updateTheme(id);
    setSaving(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium">Theme</h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred color theme
          {wildcardLabel && (
            <span className="ml-2 text-primary">({wildcardLabel})</span>
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((t) => {
          const isActive = activeTheme === t.id;
          const isWildcard = t.id === "wildcard";
          return (
            <Card
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(t.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(t.id);
                }
              }}
              className={cn(
                "relative cursor-pointer p-4 transition-all hover:ring-2 hover:ring-primary/50",
                isActive && "ring-2 ring-primary",
                saving === t.id && "opacity-70"
              )}
            >
              {isActive && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}

              {/* Preview swatches */}
              <div className="mb-3 flex h-12 overflow-hidden rounded-md border">
                {isWildcard ? (
                  <div className="flex w-full items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    <Dices className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <>
                    <div className="flex-1" style={{ backgroundColor: t.preview.bg }} />
                    <div className="flex-1" style={{ backgroundColor: t.preview.card }} />
                    <div className="w-8" style={{ backgroundColor: t.preview.primary }} />
                    <div className="w-8" style={{ backgroundColor: t.preview.accent }} />
                  </>
                )}
              </div>

              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
