"use client";

import {
  AlertTriangle,
  FileText,
  PhoneForwarded,
  UserPlus,
  Zap,
  CheckCircle2,
  Star,
} from "lucide-react";
import { useState, useTransition, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getLevel, getXpInCurrentLevel, XP_PER_LEVEL } from "@/lib/utils";
import type { MissionTask, SalesMissionType } from "@/types";
import Link from "next/link";
import { completeMission } from "@/actions/missions";

const typeIcons = {
  stagnation: AlertTriangle,
  proposal: FileText,
  follow_up: PhoneForwarded,
  outreach: UserPlus,
};

const typeColors = {
  stagnation: "text-red-400",
  proposal: "text-amber-400",
  follow_up: "text-blue-400",
  outreach: "text-emerald-400",
};

const priorityColors = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low: "bg-muted text-muted-foreground",
};

interface MissionListProps {
  missions: MissionTask[];
  completedTitles: string[];
  lifetimeXp: number;
}

export function MissionList({ missions, completedTitles, lifetimeXp }: MissionListProps) {
  const preCompleted = new Set(
    missions.filter((m) => completedTitles.includes(m.title)).map((m) => m.id)
  );
  const preXP = missions
    .filter((m) => preCompleted.has(m.id))
    .reduce((s, m) => s + m.xp_value, 0);

  const [completed, setCompleted] = useState<Set<string>>(preCompleted);
  const [xpEarned, setXpEarned] = useState(preXP);
  const [totalLifetimeXp, setTotalLifetimeXp] = useState(lifetimeXp);
  const [isPending, startTransition] = useTransition();
  const [celebrating, setCelebrating] = useState<string | null>(null);

  const totalXP = missions.reduce((s, m) => s + m.xp_value, 0);
  const activeMissions = missions.filter((m) => !completed.has(m.id));
  const level = getLevel(totalLifetimeXp);
  const xpInLevel = getXpInCurrentLevel(totalLifetimeXp);

  const handleComplete = useCallback((mission: MissionTask) => {
    setCompleted((prev) => new Set(prev).add(mission.id));
    setXpEarned((prev) => prev + mission.xp_value);
    setTotalLifetimeXp((prev) => prev + mission.xp_value);
    setCelebrating(mission.id);
    setTimeout(() => setCelebrating(null), 1200);

    startTransition(async () => {
      await completeMission(
        mission.title,
        mission.description,
        mission.priority,
        mission.xp_value,
        mission.lead_id
      );
    });
  }, [startTransition]);

  return (
    <div className="space-y-6">
      {/* Lifetime stats + daily progress */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Lifetime XP card */}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
              <Star className="h-7 w-7 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{totalLifetimeXp}</span>
                <span className="text-sm text-muted-foreground">XP</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  LVL {level}
                </span>
              </div>
              <div className="mt-1.5">
                <div className="mb-0.5 flex justify-between text-[10px] text-muted-foreground">
                  <span>Level {level}</span>
                  <span>{xpInLevel}/{XP_PER_LEVEL} to next</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${(xpInLevel / XP_PER_LEVEL) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily progress card */}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Today&apos;s Missions
                </span>
                <span className="text-sm font-bold text-primary">
                  {xpEarned} / {totalXP} XP
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${totalXP > 0 ? (xpEarned / totalXP) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeMissions.length} missions remaining
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission cards */}
      <div className="grid gap-3">
        {missions.map((mission) => {
          const Icon = typeIcons[mission.type as SalesMissionType];
          const isCompleted = completed.has(mission.id);
          const isCelebrating = celebrating === mission.id;

          return (
            <Card
              key={mission.id}
              className={cn(
                "transition-all duration-300",
                isCompleted && "opacity-50",
                isCelebrating && "ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/10"
              )}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                    isCompleted
                      ? "bg-emerald-500/10"
                      : "bg-muted",
                    isCelebrating && "scale-125"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className={cn(
                      "h-5 w-5 text-emerald-400",
                      isCelebrating && "animate-bounce"
                    )} />
                  ) : (
                    <Icon
                      className={cn("h-5 w-5", typeColors[mission.type as SalesMissionType])}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-medium",
                        isCompleted && "line-through"
                      )}
                    >
                      {mission.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={priorityColors[mission.priority]}
                    >
                      {mission.priority}
                    </Badge>
                    {isCelebrating && (
                      <span className="animate-bounce text-xs font-bold text-emerald-400">
                        +{mission.xp_value} XP!
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {mission.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-primary">
                    +{mission.xp_value} XP
                  </span>
                  {mission.lead_id && (
                    <Link href={`/leads/${mission.lead_id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  )}
                  {!isCompleted && (
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleComplete(mission)}
                    >
                      Done
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
