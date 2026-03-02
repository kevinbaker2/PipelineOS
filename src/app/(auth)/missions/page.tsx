import { createClient } from "@/lib/supabase/server";
import {
  generateMissions,
  getCompletedMissionTitles,
  generateMarketingMissions,
  getCompletedMarketingTitles,
  getWeeklyMarketingXp,
  getUserWorkDays,
} from "@/services/missions";
import { getUserXpTotal } from "@/services/leaderboard";
import { MissionList } from "@/components/missions/mission-list";
import { MarketingMissionList } from "@/components/missions/marketing-mission-list";
import type { MissionTask } from "@/types";

export default async function MissionsPage() {
  let salesMissions: MissionTask[];
  let completedTitles: string[] = [];
  let lifetimeXp = 0;
  let marketingMissions: MissionTask[] = [];
  let completedMarketingTitles: string[] = [];
  let weeklyMktXp = 0;
  let isDayOff = false;

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const workDays = await getUserWorkDays(user.id);
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
      const todayNum = dayOfWeek === 0 ? 7 : dayOfWeek; // 1=Mon,...,7=Sun
      isDayOff = !workDays.includes(todayNum);

      if (isDayOff) {
        salesMissions = [];
        marketingMissions = [];
        lifetimeXp = await getUserXpTotal(user.id);
      } else {
        const [
          sales,
          salesCompleted,
          xp,
          marketing,
          mktCompleted,
          mktWeeklyXp,
        ] = await Promise.all([
          generateMissions(user.id),
          getCompletedMissionTitles(),
          getUserXpTotal(user.id),
          generateMarketingMissions(user.id),
          getCompletedMarketingTitles(),
          getWeeklyMarketingXp(user.id),
        ]);

        salesMissions = sales;
        completedTitles = salesCompleted;
        lifetimeXp = xp;
        marketingMissions = marketing;
        completedMarketingTitles = mktCompleted;
        weeklyMktXp = mktWeeklyXp;
      }
    } else {
      salesMissions = [];
    }
  } catch {
    // Demo fallback
    salesMissions = [
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
    marketingMissions = [
      {
        id: "demo-mkt-1",
        type: "network_post",
        title: "[MKT:network_post:2026-W10:Step1] Write & publish post",
        description: "Network Post — Write & publish post",
        xp_value: 15,
        priority: "medium",
        category: "marketing",
        stepNumber: 1,
        totalSteps: 1,
        stepLabel: "Write & publish post",
      },
      {
        id: "demo-mkt-2",
        type: "case_study",
        title: "[MKT:case_study:2026-03:Step1] Outline case study",
        description: "Case Study — Outline case study",
        xp_value: 25,
        priority: "medium",
        category: "marketing",
        stepNumber: 1,
        totalSteps: 3,
        stepLabel: "Outline case study",
      },
    ];
  }

  if (isDayOff) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Smart Missions</h1>
          <p className="text-sm text-muted-foreground">
            AI-generated daily tasks based on your pipeline health
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/30 py-16 text-center">
          <span className="text-5xl">&#127881;</span>
          <h2 className="mt-4 text-xl font-bold">No missions today — enjoy your day off!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your work schedule doesn&apos;t include today. Missions will resume on your next working day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Smart Missions</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated daily tasks based on your pipeline health
        </p>
      </div>

      <MissionList
        missions={salesMissions}
        completedTitles={completedTitles}
        lifetimeXp={lifetimeXp}
      />

      <div className="border-t border-border pt-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Content Marketing</h2>
          <p className="text-sm text-muted-foreground">
            Weekly &amp; monthly content workflows with step-by-step progress
          </p>
        </div>
        <MarketingMissionList
          missions={marketingMissions}
          completedTitles={completedMarketingTitles}
          weeklyXp={weeklyMktXp}
        />
      </div>
    </div>
  );
}
