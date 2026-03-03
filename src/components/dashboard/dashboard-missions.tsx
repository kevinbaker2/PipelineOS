"use client";

import {
  AlertTriangle,
  FileText,
  PhoneForwarded,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { useState, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MissionTask, SalesMissionType } from "@/types";
import Link from "next/link";
import { completeMission } from "@/actions/missions";

const typeIcons: Record<string, React.ElementType> = {
  stagnation: AlertTriangle,
  proposal: FileText,
  follow_up: PhoneForwarded,
  outreach: UserPlus,
};

const typeColors: Record<string, string> = {
  stagnation: "text-red-400",
  proposal: "text-amber-400",
  follow_up: "text-blue-400",
  outreach: "text-emerald-400",
};

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low: "bg-muted text-muted-foreground",
};

interface DashboardMissionsProps {
  missions: MissionTask[];
  completedTitles: string[];
}

export function DashboardMissions({ missions, completedTitles }: DashboardMissionsProps) {
  const top5 = missions.slice(0, 5);
  const preCompleted = new Set(
    top5.filter((m) => completedTitles.includes(m.title)).map((m) => m.id)
  );

  const [completed, setCompleted] = useState<Set<string>>(preCompleted);
  const [isPending, startTransition] = useTransition();
  const [celebrating, setCelebrating] = useState<string | null>(null);

  const handleComplete = useCallback((mission: MissionTask) => {
    setCompleted((prev) => new Set(prev).add(mission.id));
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Missions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {top5.map((mission) => {
          const Icon = typeIcons[mission.type as SalesMissionType] ?? AlertTriangle;
          const isCompleted = completed.has(mission.id);
          const isCelebrating = celebrating === mission.id;

          return (
            <div
              key={mission.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2 transition-all duration-300",
                isCompleted && "opacity-50",
                isCelebrating && "ring-1 ring-emerald-400/50"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  isCompleted ? "bg-emerald-500/10" : "bg-muted"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Icon className={cn("h-4 w-4", typeColors[mission.type as SalesMissionType])} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-medium truncate", isCompleted && "line-through")}>
                  {mission.title}
                </p>
              </div>

              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", priorityColors[mission.priority])}>
                {mission.priority}
              </Badge>

              <span className="text-[10px] font-bold text-primary shrink-0">
                +{mission.xp_value}
              </span>

              {!isCompleted && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  disabled={isPending}
                  onClick={() => handleComplete(mission)}
                >
                  Done
                </Button>
              )}

              {isCelebrating && (
                <span className="animate-bounce text-[10px] font-bold text-emerald-400">
                  +{mission.xp_value}!
                </span>
              )}
            </div>
          );
        })}

        <Link
          href="/missions"
          className="block pt-2 text-center text-xs text-primary hover:underline"
        >
          View all →
        </Link>
      </CardContent>
    </Card>
  );
}
