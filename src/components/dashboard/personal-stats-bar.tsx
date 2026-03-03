"use client";

import { Star, Target, Zap, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getLevel, getXpInCurrentLevel, XP_PER_LEVEL } from "@/lib/utils";

interface PersonalStatsBarProps {
  lifetimeXp: number;
  todayCompleted: number;
  todayTotal: number;
  weeklyXp: number;
}

export function PersonalStatsBar({
  lifetimeXp,
  todayCompleted,
  todayTotal,
  weeklyXp,
}: PersonalStatsBarProps) {
  const level = getLevel(lifetimeXp);
  const xpInLevel = getXpInCurrentLevel(lifetimeXp);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Level + XP bar */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <Star className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">LVL {level}</span>
              <span className="text-xs text-muted-foreground">{lifetimeXp} XP</span>
            </div>
            <div className="mt-1">
              <div className="h-1.5 w-full rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${(xpInLevel / XP_PER_LEVEL) * 100}%` }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {xpInLevel}/{XP_PER_LEVEL} to next
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Missions */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Today&apos;s Missions</p>
            <p className="text-lg font-bold">
              {todayCompleted}
              <span className="text-sm font-normal text-muted-foreground">/{todayTotal} done</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly XP */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Weekly XP</p>
            <p className="text-lg font-bold">
              {weeklyXp}
              <span className="text-sm font-normal text-muted-foreground"> XP</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Streak */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
            <Flame className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
