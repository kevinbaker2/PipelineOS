import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/types";

export async function getLeads(): Promise<Lead[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getLeadsByPhase(): Promise<Record<string, Lead[]>> {
  const leads = await getLeads();
  return leads.reduce((acc, lead) => {
    if (!acc[lead.phase]) acc[lead.phase] = [];
    acc[lead.phase].push(lead);
    return acc;
  }, {} as Record<string, Lead[]>);
}

export async function getLead(id: string): Promise<Lead | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getLeadActivities(leadId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*, user:users(full_name, email)")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
