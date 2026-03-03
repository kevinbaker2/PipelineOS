"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateWorkDays, updateMissionCategories } from "@/actions/settings";

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

const CATEGORY_OPTIONS = [
  { key: "sales", label: "Sales Missions", emoji: "\uD83D\uDCBC", description: "Pipeline stagnation alerts, follow-ups, outreach" },
  { key: "marketing", label: "Marketing Missions", emoji: "\uD83D\uDCE3", description: "Content workflows: articles, posts, case studies, video ads" },
  { key: "lead_generation", label: "Lead Generation", emoji: "\uD83C\uDFAF", description: "LinkedIn engagement, prospecting, website visitor reviews" },
];

interface ScheduleSettingsProps {
  workDays: number[];
  missionCategories: string[];
}

export function ScheduleSettings({
  workDays: initialWorkDays,
  missionCategories: initialCategories,
}: ScheduleSettingsProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set(initialWorkDays));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [categories, setCategories] = useState<Set<string>>(new Set(initialCategories));
  const [catPending, startCatTransition] = useTransition();
  const [catSaved, setCatSaved] = useState(false);

  function toggleDay(day: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    const days = Array.from(selected).sort();
    startTransition(async () => {
      const result = await updateWorkDays(days);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  function toggleCategory(key: string) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setCatSaved(false);
  }

  function handleSaveCategories() {
    const cats = Array.from(categories);
    startCatTransition(async () => {
      const result = await updateMissionCategories(cats);
      if (result.success) {
        setCatSaved(true);
        setTimeout(() => setCatSaved(false), 2000);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const isActive = selected.has(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "flex h-12 w-14 flex-col items-center justify-center rounded-lg border text-sm font-medium transition-all",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/50 text-muted-foreground hover:border-muted-foreground/50"
                  )}
                >
                  {day.label}
                  {isActive && <Check className="mt-0.5 h-3 w-3" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Missions are only generated on your working days.
              On non-working days you&apos;ll see a friendly day-off message instead.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending}
            className="gap-2"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isPending ? "Saving..." : "Save Schedule"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mission Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose which types of missions appear on your dashboard.
          </p>

          <div className="space-y-2">
            {CATEGORY_OPTIONS.map((opt) => {
              const isOn = categories.has(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleCategory(opt.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
                    isOn
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-muted/30 opacity-60 hover:opacity-80"
                  )}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", isOn ? "text-foreground" : "text-muted-foreground")}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                  <div className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all",
                    isOn
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  )}>
                    {isOn && <Check className="h-3 w-3" />}
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleSaveCategories}
            disabled={catPending}
            className="gap-2"
          >
            {catSaved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {catPending ? "Saving..." : "Save Preferences"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
