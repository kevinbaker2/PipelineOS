"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const supabase = createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signup(formData: FormData) {
  const supabase = createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const orgName = formData.get("orgName") as string;

  // Create the auth user (regular client)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Signup failed" };

  // Use service role client for DB inserts (bypasses RLS since
  // the user doesn't have an active session yet after signUp)
  const admin = createServiceClient();

  // Create org
  const slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: orgName, slug })
    .select()
    .single();

  if (orgError) return { error: orgError.message };

  // Create user profile
  const { error: userError } = await admin.from("users").insert({
    id: authData.user.id,
    org_id: org.id,
    email,
    full_name: fullName,
    role: "admin",
  });

  if (userError) return { error: userError.message };

  // Insert default phase settings
  const phases = [
    { org_id: org.id, name: "Discovery", order: 1, color: "#6366f1", target_days: 14 },
    { org_id: org.id, name: "Qualification", order: 2, color: "#8b5cf6", target_days: 10 },
    { org_id: org.id, name: "Proposal", order: 3, color: "#f59e0b", target_days: 7 },
    { org_id: org.id, name: "Negotiation", order: 4, color: "#f97316", target_days: 7 },
    { org_id: org.id, name: "Closed Won", order: 5, color: "#22c55e", target_days: 0 },
    { org_id: org.id, name: "Closed Lost", order: 6, color: "#ef4444", target_days: 0 },
  ];
  await admin.from("phase_settings").insert(phases);

  // Insert default scoring settings
  const scoring = [
    { org_id: org.id, category: "firmographic", key: "company_size", label: "Company size 50+", max_points: 15 },
    { org_id: org.id, category: "firmographic", key: "industry_fit", label: "Industry fit", max_points: 15 },
    { org_id: org.id, category: "firmographic", key: "own_product", label: "Has own product", max_points: 10 },
    { org_id: org.id, category: "firmographic", key: "geography", label: "Target geography", max_points: 10 },
    { org_id: org.id, category: "engagement", key: "meetings_held", label: "Meetings held", max_points: 15 },
    { org_id: org.id, category: "engagement", key: "decision_maker", label: "Decision maker access", max_points: 10 },
    { org_id: org.id, category: "engagement", key: "inbound_lead", label: "Inbound lead", max_points: 10 },
    { org_id: org.id, category: "strategic", key: "scaling", label: "Scaling or hiring", max_points: 15 },
    { org_id: org.id, category: "strategic", key: "no_competitor", label: "No incumbent competitor", max_points: 10 },
    { org_id: org.id, category: "strategic", key: "budget_confirmed", label: "Budget confirmed", max_points: 10 },
    { org_id: org.id, category: "strategic", key: "urgency", label: "Urgent timeline", max_points: 5 },
  ];
  await admin.from("scoring_settings").insert(scoring);

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { success: true };
}
