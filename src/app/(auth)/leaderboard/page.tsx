import { createClient } from "@/lib/supabase/server";
import { getLeaderboard } from "@/services/leaderboard";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";
import type { LeaderboardEntry } from "@/services/leaderboard";

export default async function LeaderboardPage() {
  let entries: LeaderboardEntry[] = [];
  let currentUserId = "";

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id ?? "";
    entries = await getLeaderboard();
  } catch {
    entries = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Team rankings by total XP earned from completed missions
        </p>
      </div>
      <LeaderboardView entries={entries} currentUserId={currentUserId} />
    </div>
  );
}
