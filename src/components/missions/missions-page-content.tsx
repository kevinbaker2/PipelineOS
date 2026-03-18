"use client";

import { useState, useCallback, useTransition } from "react";
import { MissionList } from "@/components/missions/mission-list";
import { MarketingMissionList } from "@/components/missions/marketing-mission-list";
import { stripBracketPrefix } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import type { MissionTask } from "@/types";
import type { CarryoverTask } from "@/services/missions";
import Link from "next/link";
import { completeCarryoverTask } from "@/actions/missions";

interface MissionsPageContentProps {
  salesMissions: MissionTask[];
  contentMissions: MissionTask[];
  leadGenMissions: MissionTask[];
  completedTitles: string[];
  completedMarketingTitles: string[];
  lifetimeXp: number;
  weeklyMktXp: number;
  missionCategories: string[];
  carryoverTasks: CarryoverTask[];
  todayLabel: string;
}

export function MissionsPageContent({
  salesMissions,
  contentMissions,
  leadGenMissions,
  completedTitles,
  completedMarketingTitles,
  lifetimeXp,
  weeklyMktXp,
  missionCategories,
  carryoverTasks,
  todayLabel,
}: MissionsPageContentProps) {
  const allTodayMissions = [...salesMissions, ...contentMissions, ...leadGenMissions];
  const totalTodayXp = allTodayMissions.reduce((s, m) => s + m.xp_value, 0);

  const showSales = missionCategories.includes("sales");
  const showMarketing = missionCategories.includes("marketing");
  const showLeadGen = missionCategories.includes("lead_generation");

  return (
    <>
      {/* Today's Focus header */}
      <div>
        <h1 className="text-2xl font-bold">Today&apos;s Focus</h1>
        <p className="text-sm text-muted-foreground">
          {todayLabel} &middot; {allTodayMissions.length} missions &middot; {totalTodayXp} XP
        </p>
      </div>

      {/* Carryover tasks */}
      {carryoverTasks.length > 0 && (
        <CarryoverSection tasks={carryoverTasks} />
      )}

      {showSales && (
        <MissionList
          missions={salesMissions}
          completedTitles={completedTitles}
          lifetimeXp={lifetimeXp}
        />
      )}

      {showLeadGen && leadGenMissions.length > 0 && (
        <div className="border-t border-border pt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">{"\uD83C\uDFAF"} Lead Generation</h2>
            <p className="text-sm text-muted-foreground">
              LinkedIn engagement, prospecting &amp; website visitor follow-ups
            </p>
          </div>
          <MarketingMissionList
            missions={leadGenMissions}
            completedTitles={completedMarketingTitles}
            weeklyXp={weeklyMktXp}
          />
        </div>
      )}

      {showMarketing && (
        <div className="border-t border-border pt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">{"\uD83D\uDCE3"} Content &amp; Marketing</h2>
            <p className="text-sm text-muted-foreground">
              Weekly &amp; monthly content workflows with step-by-step progress
            </p>
          </div>
          <MarketingMissionList
            missions={contentMissions}
            completedTitles={completedMarketingTitles}
            weeklyXp={weeklyMktXp}
          />
        </div>
      )}
    </>
  );
}

function CarryoverSection({ tasks }: { tasks: CarryoverTask[] }) {
  const totalCarryXp = tasks.reduce((s, t) => s + t.xp_value, 0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleComplete = useCallback((task: CarryoverTask) => {
    setCompleted((prev) => new Set(prev).add(task.id));
    setCelebrating(task.id);
    setTimeout(() => setCelebrating(null), 1200);

    startTransition(async () => {
      await completeCarryoverTask(task.id);
    });
  }, [startTransition]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-amber-400">&#x23F0;</span>
        <h2 className="text-base font-semibold text-amber-400">
          Carried Over ({tasks.length})
        </h2>
        <span className="text-xs text-muted-foreground">
          +{totalCarryXp} XP unclaimed
        </span>
      </div>
      <div className="grid gap-2">
        {tasks.map((task) => {
          const isCompleted = completed.has(task.id);
          const isCelebrating = celebrating === task.id;

          return (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 transition-all duration-300",
                isCompleted && "opacity-50",
                isCelebrating && "ring-1 ring-emerald-400/50"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                isCompleted ? "bg-emerald-500/10" : "bg-amber-500/10"
              )}>
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <span className="text-xs font-bold text-amber-400">!</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", isCompleted && "line-through")}>
                  {stripBracketPrefix(task.title)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Due {task.due_date} &middot; {task.priority}
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold text-amber-400">
                +{task.xp_value} XP
              </span>
              {task.lead_id && (
                <Link href={`/leads/${task.lead_id}`}>
                  <span className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50">
                    View
                  </span>
                </Link>
              )}
              {!isCompleted && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  disabled={isPending}
                  onClick={() => handleComplete(task)}
                >
                  Done
                </Button>
              )}
              {isCelebrating && (
                <span className="animate-bounce text-xs font-bold text-emerald-400">
                  +{task.xp_value}!
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
