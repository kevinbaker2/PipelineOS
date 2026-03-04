"use client";

import { useState } from "react";
import { Check, Dices } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES, generateWildcardPalette } from "@/lib/themes";
import { useTheme } from "@/components/theme-provider";
import { updateTheme } from "@/actions/settings";
import { Card } from "@/components/ui/card";

export function AppearanceSettings({ currentTheme }: { currentTheme: string }) {
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState<string | null>(null);
  const activeTheme = theme || currentTheme;
  const wildcardPalette = generateWildcardPalette();

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
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((t) => {
          const isActive = activeTheme === t.id;
          const isWildcard = t.id === "wildcard";
          const preview = isWildcard ? wildcardPalette.preview : t.preview;
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
                <div className="flex-1" style={{ backgroundColor: preview.bg }} />
                <div className="flex-1" style={{ backgroundColor: preview.card }} />
                <div className="w-8" style={{ backgroundColor: preview.primary }} />
                <div className="w-8" style={{ backgroundColor: preview.accent }} />
              </div>

              <div className="flex items-center gap-1.5">
                {isWildcard && <Dices className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <p className="text-sm font-medium">{t.name}</p>
              </div>

              {isWildcard ? (
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Today&apos;s palette</span>
                    <div className="flex gap-1">
                      {[preview.bg, preview.card, preview.primary, preview.accent].map((color, i) => (
                        <div
                          key={i}
                          className="h-2.5 w-2.5 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t.description}</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
