import { createClient } from "@/lib/supabase/server";
import {
  generateMissions,
  getCompletedMissionTitles,
  generateMarketingMissions,
  generateLeadGenMissions,
  getCompletedMarketingTitles,
  getWeeklyMarketingXp,
  getUserWorkDays,
  getUserMissionCategories,
  getCarryoverMissions,
} from "@/services/missions";
import { getUserXpTotal } from "@/services/leaderboard";
import { MissionsPageContent } from "@/components/missions/missions-page-content";
import { getDailyQuote } from "@/lib/quotes";
import type { MissionTask } from "@/types";
import type { CarryoverTask } from "@/services/missions";
import { format } from "date-fns";

export default async function MissionsPage() {
  let allSalesMissions: MissionTask[];
  let completedTitles: string[] = [];
  let lifetimeXp = 0;
  let contentMissions: MissionTask[] = [];
  let leadGenMissions: MissionTask[] = [];
  let completedMarketingTitles: string[] = [];
  let weeklyMktXp = 0;
  let isDayOff = false;
  let missionCategories: string[] = ["sales", "marketing"];
  let carryoverTasks: CarryoverTask[] = [];

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [workDays, categories] = await Promise.all([
        getUserWorkDays(user.id),
        getUserMissionCategories(user.id),
      ]);
      missionCategories = categories;

      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
      const todayNum = dayOfWeek === 0 ? 7 : dayOfWeek; // 1=Mon,...,7=Sun
      isDayOff = !workDays.includes(todayNum);

      // Always fetch carryover regardless of day off
      carryoverTasks = await getCarryoverMissions(user.id);

      if (isDayOff) {
        allSalesMissions = [];
        lifetimeXp = await getUserXpTotal(user.id);
      } else {
        const showSales = missionCategories.includes("sales");
        const showMarketing = missionCategories.includes("marketing");
        const showLeadGen = missionCategories.includes("lead_generation");
        const needMktData = showMarketing || showLeadGen;

        const [
          sales,
          salesCompleted,
          xp,
          content,
          leadGen,
          mktCompleted,
          mktWeeklyXp,
        ] = await Promise.all([
          showSales ? generateMissions(user.id, "all") : Promise.resolve([]),
          showSales ? getCompletedMissionTitles() : Promise.resolve([]),
          getUserXpTotal(user.id),
          showMarketing ? generateMarketingMissions(user.id) : Promise.resolve([]),
          showLeadGen ? generateLeadGenMissions(user.id) : Promise.resolve([]),
          needMktData ? getCompletedMarketingTitles() : Promise.resolve([]),
          needMktData ? getWeeklyMarketingXp(user.id) : Promise.resolve(0),
        ]);

        allSalesMissions = sales;
        completedTitles = salesCompleted;
        lifetimeXp = xp;
        contentMissions = content;
        leadGenMissions = leadGen;
        completedMarketingTitles = mktCompleted;
        weeklyMktXp = mktWeeklyXp;
      }
    } else {
      allSalesMissions = [];
    }
  } catch {
    // Demo fallback
    allSalesMissions = [
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
    contentMissions = [
      {
        id: "demo-mkt-1",
        type: "network_post",
        title: "[MKT:network_post:2026-W10:Step1] Write & publish post",
        description: "Network Post — Write & publish post",
        xp_value: 15,
        priority: "medium",
        category: "marketing",
        subcategory: "content",
        stepNumber: 1,
        totalSteps: 1,
        stepLabel: "Write & publish post",
      },
    ];
    leadGenMissions = [
      {
        id: "demo-lg-1",
        type: "linkedin_engagement",
        title: "[LG:linkedin_engagement:2026-W10:1] LinkedIn Engagement Check",
        description: "Check who liked or commented on your recent LinkedIn posts — add interesting profiles as a lead in PipelineOS",
        xp_value: 20,
        priority: "high",
        category: "marketing",
        subcategory: "lead_generation",
      },
    ];
  }

  const quote = getDailyQuote();
  const todayLabel = format(new Date(), "EEEE, MMMM d");

  if (isDayOff) {
    return (
      <div className="space-y-6">
        {/* Quote banner */}
        <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
          <p className="text-sm italic text-muted-foreground">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            — {quote.author}
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
      {/* Quote banner */}
      <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
        <p className="text-sm italic text-muted-foreground">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          — {quote.author}
        </p>
      </div>

      <MissionsPageContent
        allSalesMissions={allSalesMissions}
        contentMissions={contentMissions}
        leadGenMissions={leadGenMissions}
        completedTitles={completedTitles}
        completedMarketingTitles={completedMarketingTitles}
        lifetimeXp={lifetimeXp}
        weeklyMktXp={weeklyMktXp}
        missionCategories={missionCategories}
        carryoverTasks={carryoverTasks}
        todayLabel={todayLabel}
      />
    </div>
  );
}
