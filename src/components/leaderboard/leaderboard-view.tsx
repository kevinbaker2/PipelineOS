"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, getLevel, getXpInCurrentLevel, XP_PER_LEVEL } from "@/lib/utils";
import { Medal, Zap, Trophy, Target } from "lucide-react";
import type { LeaderboardEntry } from "@/services/leaderboard";

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

const rankIcons = [
  { bg: "bg-amber-500/10", text: "text-amber-400" },
  { bg: "bg-slate-300/10", text: "text-slate-300" },
  { bg: "bg-orange-600/10", text: "text-orange-500" },
];

export function LeaderboardView({ entries, currentUserId }: LeaderboardViewProps) {
  const currentUser = entries.find((e) => e.id === currentUserId);
  const currentRank = entries.findIndex((e) => e.id === currentUserId) + 1;
  const totalTasks = entries.reduce((s, e) => s + e.tasks_this_week, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Medal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your Rank</p>
              <p className="text-xl font-bold">
                #{currentRank || "-"}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  of {entries.length}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your Total XP</p>
              <p className="text-xl font-bold">{currentUser?.xp_total ?? 0} XP</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <Target className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Team Tasks This Week</p>
              <p className="text-xl font-bold">{totalTasks}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-amber-400" />
            Organization Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <div className="hidden items-center gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[60px_2fr_80px_100px_100px]">
              <span>Rank</span>
              <span>Name</span>
              <span>Level</span>
              <span className="text-right">Total XP</span>
              <span className="text-right">This Week</span>
            </div>
            {entries.map((entry, i) => {
              const rank = i + 1;
              const level = getLevel(entry.xp_total);
              const xpInLevel = getXpInCurrentLevel(entry.xp_total);
              const isSelf = entry.id === currentUserId;
              const rankStyle = rankIcons[i] ?? null;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "grid items-center gap-4 border-b px-4 py-3 last:border-0 md:grid-cols-[60px_2fr_80px_100px_100px]",
                    isSelf && "bg-primary/5"
                  )}
                >
                  {/* Rank */}
                  <div>
                    {rankStyle ? (
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                          rankStyle.bg,
                          rankStyle.text
                        )}
                      >
                        {rank}
                      </div>
                    ) : (
                      <span className="pl-2 text-sm text-muted-foreground">
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Name + email */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {entry.full_name}
                      {isSelf && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.email}
                    </p>
                  </div>

                  {/* Level + mini progress */}
                  <div>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      LVL {level}
                    </span>
                    <div className="mt-1 h-1 w-full rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(xpInLevel / XP_PER_LEVEL) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Total XP */}
                  <div className="text-right">
                    <span className="text-sm font-bold">{entry.xp_total}</span>
                    <span className="ml-1 text-xs text-muted-foreground">XP</span>
                  </div>

                  {/* Tasks this week */}
                  <div className="text-right">
                    <span className="text-sm font-medium">
                      {entry.tasks_this_week}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      tasks
                    </span>
                  </div>
                </div>
              );
            })}

            {entries.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No team members yet. Complete missions to earn XP!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
