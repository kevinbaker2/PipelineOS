"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLead(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  const lead = {
    org_id: profile.org_id,
    company_name: formData.get("company_name") as string,
    contact_name: formData.get("contact_name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    source_note: (formData.get("source_note") as string) || null,
    phase: (formData.get("phase") as string) || "Discovery",
    sector: (formData.get("sector") as string) || "Technology",
    country: (formData.get("country") as string) || "NL",
    source: (formData.get("source") as string) || "inbound",
    expected_mrr: parseFloat(formData.get("expected_mrr") as string) || 0,
    probability: parseInt(formData.get("probability") as string) || 20,
    forecast_month: new Date().toISOString().slice(0, 7),
    score: parseInt(formData.get("score") as string) || 0,
    assigned_to: user.id,
  };

  const { error } = await supabase.from("leads").insert(lead);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateLeadPhase(leadId: string, phase: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("leads")
    .update({ phase, last_activity_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateLead(leadId: string, data: Record<string, unknown>) {
  const supabase = createClient();

  const { error } = await supabase
    .from("leads")
    .update({ ...data, last_activity_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

export async function updateLeadScore(leadId: string, checkedIds: string[], totalScore: number) {
  const supabase = createClient();

  const { error } = await supabase
    .from("leads")
    .update({
      score: totalScore,
      score_details: checkedIds,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

export async function deleteLead(leadId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function addActivity(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  const leadId = formData.get("lead_id") as string;

  const activity = {
    org_id: profile.org_id,
    lead_id: leadId,
    user_id: user.id,
    type: formData.get("type") as string,
    notes: formData.get("notes") as string,
  };

  const { error } = await supabase.from("activities").insert(activity);
  if (error) return { error: error.message };

  // Update lead's last_activity_at
  await supabase
    .from("leads")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", leadId);

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}
