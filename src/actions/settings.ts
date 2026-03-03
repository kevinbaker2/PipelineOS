"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
