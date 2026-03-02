import { createClient } from "@/lib/supabase/server";

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  email: string;
  xp_total: number;
  tasks_this_week: number;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = createClient();

  // Get all org users with xp_total
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, xp_total")
    .order("xp_total", { ascending: false });

  if (!users || users.length === 0) return [];

  // Get tasks completed this week per user
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const weekStart = monday.toISOString().slice(0, 10);

  const { data: weeklyTasks } = await supabase
    .from("tasks")
    .select("user_id")
    .not("completed_at", "is", null)
    .gte("due_date", weekStart);

  // Count tasks per user
  const weeklyCountMap = new Map<string, number>();
  (weeklyTasks ?? []).forEach((t) => {
    weeklyCountMap.set(t.user_id, (weeklyCountMap.get(t.user_id) ?? 0) + 1);
  });

  return users.map((u) => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    xp_total: u.xp_total ?? 0,
    tasks_this_week: weeklyCountMap.get(u.id) ?? 0,
  }));
}

export async function getUserXpTotal(userId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("xp_total")
    .eq("id", userId)
    .single();

  return data?.xp_total ?? 0;
}
