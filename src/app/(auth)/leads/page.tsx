import { createClient } from "@/lib/supabase/server";
import { getLeads } from "@/services/leads";
import { LeadsTable } from "@/components/leads/leads-table";
import type { Lead } from "@/types";

export default async function LeadsPage() {
  let leads: Lead[] = [];
  let users: { id: string; full_name: string }[] = [];
  let phases: string[] = [];

  try {
    const supabase = createClient();
    leads = await getLeads();

    const { data: orgUsers } = await supabase
      .from("users")
      .select("id, full_name");
    users = orgUsers ?? [];

    const { data: phaseSettings } = await supabase
      .from("phase_settings")
      .select("name")
      .order("order", { ascending: true });

    phases = phaseSettings?.length
      ? phaseSettings.map((p) => p.name)
      : ["Discovery", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
  } catch {
    leads = [];
  }

  return <LeadsTable leads={leads} users={users} phases={phases} />;
}
