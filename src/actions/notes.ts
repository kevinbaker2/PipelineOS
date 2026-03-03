"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addTeamNote(formData: FormData) {
  console.log("[addTeamNote] called with content:", formData.get("content"), "color:", formData.get("color"));

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("[addTeamNote] ERROR: no authenticated user");
    return { error: "Unauthorized" };
  }
  console.log("[addTeamNote] user:", user.id);

  const { data: profile } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    console.log("[addTeamNote] ERROR: no profile found for user", user.id);
    return { error: "Profile not found" };
  }

  const content = formData.get("content") as string;
  const color = (formData.get("color") as string) || "yellow";

  if (!content?.trim()) return { error: "Content is required" };

  const { error } = await supabase.from("team_notes").insert({
    org_id: profile.org_id,
    user_id: user.id,
    message: content.trim(),
    color,
  });

  if (error) {
    console.log("[addTeamNote] DB error:", error.message);
    return { error: error.message };
  }

  console.log("[addTeamNote] SUCCESS — revalidating /dashboard");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTeamNote(noteId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("team_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
