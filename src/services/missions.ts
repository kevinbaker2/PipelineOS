import { createClient } from "@/lib/supabase/server";
import type { MissionTask } from "@/types";
import { differenceInDays, parseISO } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMissions(userId: string): Promise<MissionTask[]> {
  const supabase = createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .neq("phase", "Closed Won")
    .neq("phase", "Closed Lost");

  const activeLeads = leads ?? [];
  const now = new Date();
  const missions: MissionTask[] = [];

  // 1. Stagnation alerts: leads with no activity > 5 days
  const staleLeads = activeLeads
    .filter((l) => differenceInDays(now, parseISO(l.last_activity_at)) > 5)
    .sort((a, b) => Number(b.expected_mrr) - Number(a.expected_mrr))
    .slice(0, 3);

  staleLeads.forEach((lead) => {
    const daysSince = differenceInDays(now, parseISO(lead.last_activity_at));
    missions.push({
      id: `stale-${lead.id}`,
      type: "stagnation",
      title: `Re-engage ${lead.company_name}`,
      description: `No activity for ${daysSince} days. Expected MRR: $${Number(lead.expected_mrr).toLocaleString()}`,
      lead_id: lead.id,
      lead_name: lead.company_name,
      xp_value: 15,
      priority: daysSince > 10 ? "critical" : "high",
    });
  });

  // 2. Proposals > 7 days without movement
  const staleProposals = activeLeads
    .filter(
      (l) =>
        l.phase === "Proposal" &&
        differenceInDays(now, parseISO(l.last_activity_at)) > 7
    )
    .slice(0, 3);

  staleProposals.forEach((lead) => {
    missions.push({
      id: `proposal-${lead.id}`,
      type: "proposal",
      title: `Follow up on proposal: ${lead.company_name}`,
      description: `Proposal has been pending for over 7 days. Push for decision.`,
      lead_id: lead.id,
      lead_name: lead.company_name,
      xp_value: 20,
      priority: "high",
    });
  });

  // 3. Follow-ups needed (leads in Negotiation with high probability)
  const negotiationLeads = activeLeads
    .filter((l) => l.phase === "Negotiation" && l.probability >= 60)
    .slice(0, 2);

  negotiationLeads.forEach((lead) => {
    missions.push({
      id: `follow-${lead.id}`,
      type: "follow_up",
      title: `Close deal: ${lead.company_name}`,
      description: `${lead.probability}% probability, $${Number(lead.expected_mrr).toLocaleString()} MRR. Push to close.`,
      lead_id: lead.id,
      lead_name: lead.company_name,
      xp_value: 25,
      priority: "critical",
    });
  });

  // 4. Outreach targets (if pipeline is thin)
  if (activeLeads.length < 10) {
    const outreachCount = Math.min(10 - activeLeads.length, 3);
    for (let i = 0; i < outreachCount; i++) {
      missions.push({
        id: `outreach-${i}`,
        type: "outreach",
        title: `Source ${i + 1} new lead`,
        description: `Pipeline has only ${activeLeads.length} active deals. Target: 10+ active leads.`,
        xp_value: 10,
        priority: "medium",
      });
    }
  }

  return missions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export async function getCompletedMissionTitles(): Promise<string[]> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("tasks")
    .select("title")
    .eq("due_date", today)
    .not("completed_at", "is", null);

  return (data ?? []).map((t) => t.title);
}
