"use client";

import {
  PenLine,
  Share2,
  Star,
  Video,
  Globe,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { useState, useTransition, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, parseStepTitle } from "@/lib/utils";
import type { MissionTask, MarketingMissionType } from "@/types";
import { completeMission } from "@/actions/missions";

const typeIcons: Record<MarketingMissionType, typeof PenLine> = {
  linkedin_article: PenLine,
  network_post: Share2,
  case_study: Star,
  video_ad: Video,
  landing_page: Globe,
};

const typeColors: Record<MarketingMissionType, string> = {
  linkedin_article: "text-sky-400",
  network_post: "text-violet-400",
  case_study: "text-amber-400",
  video_ad: "text-rose-400",
  landing_page: "text-teal-400",
};

const dotColors: Record<MarketingMissionType, string> = {
  linkedin_article: "bg-sky-400",
  network_post: "bg-violet-400",
  case_study: "bg-amber-400",
  video_ad: "bg-rose-400",
  landing_page: "bg-teal-400",
};

const priorityColors = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low: "bg-muted text-muted-foreground",
};

interface MarketingMissionListProps {
  missions: MissionTask[];
  completedTitles: string[];
  weeklyXp: number;
}

export function MarketingMissionList({
  missions,
  completedTitles,
  weeklyXp,
}: MarketingMissionListProps) {
  const preCompleted = new Set(
    missions.filter((m) => completedTitles.includes(m.title)).map((m) => m.id)
  );
  const preXP = missions
    .filter((m) => preCompleted.has(m.id))
    .reduce((s, m) => s + m.xp_value, 0);

  const [completed, setCompleted] = useState<Set<string>>(preCompleted);
  const [xpEarned, setXpEarned] = useState(weeklyXp + preXP);
  const [isPending, startTransition] = useTransition();
  const [celebrating, setCelebrating] = useState<string | null>(null);

  const totalXP = missions.reduce((s, m) => s + m.xp_value, 0);
  const weeklyTarget = totalXP + weeklyXp;

  const handleComplete = useCallback(
    (mission: MissionTask) => {
      setCompleted((prev) => new Set(prev).add(mission.id));
      setXpEarned((prev) => prev + mission.xp_value);
      setCelebrating(mission.id);
      setTimeout(() => setCelebrating(null), 1200);

      startTransition(async () => {
        await completeMission(
          mission.title,
          mission.description,
          mission.priority,
          mission.xp_value,
          undefined,
          "marketing"
        );
      });
    },
    [startTransition]
  );

  function getDisplayTitle(title: string): string {
    const parsed = parseStepTitle(title);
    return parsed ? parsed.displayTitle : title;
  }

  return (
    <div className="space-y-6">
      {/* Weekly XP progress */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <Zap className="h-7 w-7 text-violet-400" />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Weekly Marketing XP
              </span>
              <span className="text-sm font-bold text-violet-400">
                {xpEarned} / {weeklyTarget > 0 ? weeklyTarget : "—"} XP
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{
                  width: `${weeklyTarget > 0 ? Math.min((xpEarned / weeklyTarget) * 100, 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {missions.filter((m) => !completed.has(m.id)).length} steps
              remaining this week
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mission cards */}
      {missions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No marketing missions due right now. Check back later!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {missions.map((mission) => {
            const mktType = mission.type as MarketingMissionType;
            const Icon = typeIcons[mktType];
            const isCompleted = completed.has(mission.id);
            const isCelebrating = celebrating === mission.id;

            return (
              <Card
                key={mission.id}
                className={cn(
                  "transition-all duration-300",
                  isCompleted && "opacity-50",
                  isCelebrating &&
                    "ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/10"
                )}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                      isCompleted ? "bg-emerald-500/10" : "bg-muted",
                      isCelebrating && "scale-125"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2
                        className={cn(
                          "h-5 w-5 text-emerald-400",
                          isCelebrating && "animate-bounce"
                        )}
                      />
                    ) : (
                      <Icon className={cn("h-5 w-5", typeColors[mktType])} />
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
                        {getDisplayTitle(mission.title)}
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

                    {/* Step progress dots */}
                    {mission.totalSteps && mission.totalSteps > 1 && (
                      <div className="mt-2 flex items-center gap-1.5">
                        {Array.from({ length: mission.totalSteps }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-2 w-2 rounded-full transition-all",
                              i < (mission.stepNumber ?? 1) - 1
                                ? dotColors[mktType]
                                : i === (mission.stepNumber ?? 1) - 1
                                  ? cn(dotColors[mktType], "ring-2 ring-offset-1 ring-offset-background", `ring-current`)
                                  : "bg-muted"
                            )}
                          />
                        ))}
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          Step {mission.stepNumber}/{mission.totalSteps}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-violet-400">
                      +{mission.xp_value} XP
                    </span>
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
      )}
    </div>
  );
}
