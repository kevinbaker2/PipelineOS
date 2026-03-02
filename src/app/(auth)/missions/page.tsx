import { createClient } from "@/lib/supabase/server";
import { generateMissions, getCompletedMissionTitles } from "@/services/missions";
import { getUserXpTotal } from "@/services/leaderboard";
import { MissionList } from "@/components/missions/mission-list";
import type { MissionTask } from "@/types";

export default async function MissionsPage() {
  let missions: MissionTask[];
  let completedTitles: string[] = [];
  let lifetimeXp = 0;

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    missions = user ? await generateMissions(user.id) : [];
    completedTitles = await getCompletedMissionTitles();
    lifetimeXp = user ? await getUserXpTotal(user.id) : 0;
  } catch {
    // Demo fallback
    missions = [
      {
        id: "demo-1",
        type: "stagnation",
        title: "Re-engage Acme Corp",
        description: "No activity for 12 days. Expected MRR: $5,000",
        lead_name: "Acme Corp",
        xp_value: 15,
        priority: "critical",
      },
      {
        id: "demo-2",
        type: "proposal",
        title: "Follow up on proposal: TechStart Inc",
        description: "Proposal has been pending for over 7 days. Push for decision.",
        lead_name: "TechStart Inc",
        xp_value: 20,
        priority: "high",
      },
      {
        id: "demo-3",
        type: "follow_up",
        title: "Close deal: DataFlow Systems",
        description: "80% probability, $8,500 MRR. Push to close.",
        lead_name: "DataFlow Systems",
        xp_value: 25,
        priority: "critical",
      },
      {
        id: "demo-4",
        type: "outreach",
        title: "Source 1 new lead",
        description: "Pipeline has only 5 active deals. Target: 10+ active leads.",
        xp_value: 10,
        priority: "medium",
      },
    ];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Smart Missions</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated daily tasks based on your pipeline health
        </p>
      </div>
      <MissionList
        missions={missions}
        completedTitles={completedTitles}
        lifetimeXp={lifetimeXp}
      />
    </div>
  );
}
