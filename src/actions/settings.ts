"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { VALID_THEMES } from "@/lib/themes";

export async function updatePhaseSetting(id: string, data: { name?: string; target_days?: number; color?: string }) {
  const supabase = createClient();
  const { error } = await supabase
    .from("phase_settings")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function updateScoringSetting(id: string, data: { label?: string; max_points?: number }) {
  const supabase = createClient();
  const { error } = await supabase
    .from("scoring_settings")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function addScoringSetting(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return { error: "Admin only" };

  const setting = {
    org_id: profile.org_id,
    category: formData.get("category") as string,
    key: formData.get("key") as string,
    label: formData.get("label") as string,
    max_points: parseInt(formData.get("max_points") as string) || 10,
  };

  const { error } = await supabase.from("scoring_settings").insert(setting);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteScoringSetting(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("scoring_settings").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

export async function resetScoringToDefaults() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return { error: "Admin only" };

  // Delete all existing scoring settings for this org
  const { error: delError } = await supabase
    .from("scoring_settings")
    .delete()
    .eq("org_id", profile.org_id);

  if (delError) return { error: delError.message };

  // Insert new defaults
  const defaults = [
    { org_id: profile.org_id, category: "firmographic", key: "company_size", label: "Company size 50+", max_points: 15 },
    { org_id: profile.org_id, category: "firmographic", key: "industry_fit", label: "Industry fit", max_points: 15 },
    { org_id: profile.org_id, category: "firmographic", key: "own_product", label: "Has own product", max_points: 10 },
    { org_id: profile.org_id, category: "firmographic", key: "geography", label: "Target geography", max_points: 10 },
    { org_id: profile.org_id, category: "engagement", key: "meetings_held", label: "Meetings held", max_points: 15 },
    { org_id: profile.org_id, category: "engagement", key: "decision_maker", label: "Decision maker access", max_points: 10 },
    { org_id: profile.org_id, category: "engagement", key: "inbound_lead", label: "Inbound lead", max_points: 10 },
    { org_id: profile.org_id, category: "strategic", key: "scaling", label: "Scaling or hiring", max_points: 15 },
    { org_id: profile.org_id, category: "strategic", key: "no_competitor", label: "No incumbent competitor", max_points: 10 },
    { org_id: profile.org_id, category: "strategic", key: "budget_confirmed", label: "Budget confirmed", max_points: 10 },
    { org_id: profile.org_id, category: "strategic", key: "urgency", label: "Urgent timeline", max_points: 5 },
  ];

  const { error: insError } = await supabase.from("scoring_settings").insert(defaults);
  if (insError) return { error: insError.message };

  revalidatePath("/settings");
  revalidatePath("/leads");
  return { success: true };
}

export async function updateWorkDays(workDays: number[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("users")
    .update({ work_days: workDays })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/missions");
  return { success: true };
}

export async function updateMissionCategories(categories: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("users")
    .update({ mission_categories: categories })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/missions");
  return { success: true };
}

export async function updateTheme(theme: string) {
  if (!VALID_THEMES.has(theme)) return { error: "Invalid theme" };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("users")
    .update({ theme })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true };
}
