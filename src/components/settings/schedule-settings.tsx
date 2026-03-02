"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateWorkDays } from "@/actions/settings";

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

interface ScheduleSettingsProps {
  workDays: number[];
}

export function ScheduleSettings({ workDays: initialWorkDays }: ScheduleSettingsProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set(initialWorkDays));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

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

  return (
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
  );
}
