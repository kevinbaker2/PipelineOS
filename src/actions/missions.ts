"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const { error } = await supabase.from("tasks").insert({
    org_id: profile.org_id,
    user_id: user.id,
    lead_id: leadId || null,
    title,
    description,
    priority,
    xp_value: xpValue,
    due_date: today,
    completed_at: new Date().toISOString(),
    category,
  });

  if (error) return { error: error.message };

  // Recalculate xp_total in app layer (works even without DB trigger)
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
