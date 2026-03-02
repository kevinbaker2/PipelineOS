"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return { userId: user.id, orgId: profile.org_id };
}

export async function inviteUser(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admin access required" };

  const email = formData.get("email") as string;
  const role = (formData.get("role") as string) || "sales";

  if (!email) return { error: "Email is required" };

  const serviceClient = createServiceClient();

  // Invite user via Supabase Auth admin API
  const { data: inviteData, error: inviteError } =
    await serviceClient.auth.admin.inviteUserByEmail(email);

  if (inviteError) return { error: inviteError.message };
  if (!inviteData.user) return { error: "Invite failed" };

  // Create user profile row so they appear in the team list
  const { error: profileError } = await serviceClient.from("users").insert({
    id: inviteData.user.id,
    org_id: admin.orgId,
    email,
    full_name: email.split("@")[0],
    role,
  });

  if (profileError) return { error: profileError.message };

  revalidatePath("/settings/team");
  return { success: true };
}

export async function updateUserRole(userId: string, role: string) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Admin access required" };

  if (role !== "admin" && role !== "sales") {
    return { error: "Invalid role" };
  }

  // Don't let admin demote themselves
  if (userId === admin.userId) {
    return { error: "Cannot change your own role" };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/settings/team");
  return { success: true };
}
