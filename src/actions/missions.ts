"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateDailyMissions, persistTodayMissions } from "@/services/missions";
import { format, startOfDay } from "date-fns";

export async function completeMission(
  title: string,
  description: string,
  priority: string,
  xpValue: number,
  leadId?: string,
  category: "sales" | "marketing" = "sales"
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // Try to find existing persisted task for this mission
  const { data: existingTask } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("title", title)
    .is("completed_at", null)
    .order("due_date", { ascending: false })
    .limit(1)
    .single();

  if (existingTask) {
    // Mark the existing task as completed
    const { error } = await supabase
      .from("tasks")
      .update({ completed_at: now })
      .eq("id", existingTask.id);

    if (error) return { error: error.message };
  } else {
    // Fallback: insert new task row (e.g. from dashboard widget)
    const { error } = await supabase.from("tasks").insert({
      org_id: profile.org_id,
      user_id: user.id,
      lead_id: leadId || null,
      title,
      description,
      priority,
      xp_value: xpValue,
      due_date: today,
      completed_at: now,
      category,
    });

    if (error) return { error: error.message };
  }

  // Recalculate xp_total in app layer
  const { data: xpResult } = await supabase
    .from("tasks")
    .select("xp_value")
    .eq("user_id", user.id)
    .not("completed_at", "is", null);

  const totalXp = (xpResult ?? []).reduce((s, t) => s + t.xp_value, 0);

  await supabase
    .from("users")
    .update({ xp_total: totalXp })
    .eq("id", user.id);

  revalidatePath("/missions");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath("/");
  return { success: true };
}

export async function dismissCarryoverTask(taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("tasks")
    .update({ dismissed_at: now })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/missions");
  return { success: true };
}

export async function rerollMissions() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const today = format(startOfDay(new Date()), "yyyy-MM-dd");

  const { data: profile } = await supabase
    .from("users")
    .select("org_id, last_reroll_date")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };
  if (profile.last_reroll_date === today) return { error: "Reroll already used today" };

  // Delete today's incomplete, non-dismissed tasks
  await supabase
    .from("tasks")
    .delete()
    .eq("user_id", user.id)
    .eq("due_date", today)
    .is("completed_at", null)
    .is("dismissed_at", null);

  // Generate a fresh set with a different seed offset
  const daily = await generateDailyMissions(user.id, "normal", undefined, undefined, 1);
  const allMissions = [...daily.salesMissions, ...daily.contentMissions, ...daily.leadGenMissions];
  await persistTodayMissions(user.id, profile.org_id, allMissions);

  // Mark reroll as used for today
  await supabase
    .from("users")
    .update({ last_reroll_date: today })
    .eq("id", user.id);

  revalidatePath("/missions");
  return { success: true };
}

/**
 * Complete a carried-over task by its DB id.
 */
export async function completeCarryoverTask(taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("tasks")
    .update({ completed_at: now })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Recalculate xp_total
  const { data: xpResult } = await supabase
    .from("tasks")
    .select("xp_value")
    .eq("user_id", user.id)
    .not("completed_at", "is", null);

  const totalXp = (xpResult ?? []).reduce((s, t) => s + t.xp_value, 0);

  await supabase
    .from("users")
    .update({ xp_total: totalXp })
    .eq("id", user.id);

  revalidatePath("/missions");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath("/");
  return { success: true };
}
