import { createClient } from "@/lib/supabase/server";
import {
  generateDailyMissions,
  getCompletedMissionTitles,
  getCompletedMarketingTitles,
  getWeeklyMarketingXp,
  getUserWorkDays,
  getUserMissionCategories,
  getCarryoverMissions,
  persistTodayMissions,
  getRerollStatus,
} from "@/services/missions";
import { getUserXpTotal } from "@/services/leaderboard";
import { MissionsPageContent } from "@/components/missions/missions-page-content";
import { getDailyQuote } from "@/lib/quotes";
import type { MissionTask } from "@/types";
import type { CarryoverTask } from "@/services/missions";
import { format } from "date-fns";

export default async function MissionsPage() {
  let salesMissions: MissionTask[];
  let completedTitles: string[] = [];
  let lifetimeXp = 0;
  let contentMissions: MissionTask[] = [];
  let leadGenMissions: MissionTask[] = [];
  let completedMarketingTitles: string[] = [];
  let weeklyMktXp = 0;
  let isDayOff = false;
  let missionCategories: string[] = ["sales", "marketing"];
  let carryoverTasks: CarryoverTask[] = [];
  let rerollsLeft = 1;

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

      if (isDayOff) {
        salesMissions = [];
        lifetimeXp = await getUserXpTotal(user.id);
      } else {
        const needMktData = missionCategories.includes("marketing") || missionCategories.includes("lead_generation");

        const [
          daily,
          salesCompleted,
          xp,
          mktCompleted,
          mktWeeklyXp,
        ] = await Promise.all([
          generateDailyMissions(user.id),
          getCompletedMissionTitles(),
          getUserXpTotal(user.id),
          needMktData ? getCompletedMarketingTitles() : Promise.resolve([]),
          needMktData ? getWeeklyMarketingXp(user.id) : Promise.resolve(0),
        ]);

        salesMissions = daily.salesMissions;
        contentMissions = daily.contentMissions;
        leadGenMissions = daily.leadGenMissions;
        completedTitles = salesCompleted;
        lifetimeXp = xp;
        completedMarketingTitles = mktCompleted;
        weeklyMktXp = mktWeeklyXp;

        // Persist all missions to tasks table so incomplete ones carry over
        const { data: profile } = await supabase
          .from("users")
          .select("org_id")
          .eq("id", user.id)
          .single();

        if (profile) {
          const allMissions = [...salesMissions, ...contentMissions, ...leadGenMissions];
          await persistTodayMissions(user.id, profile.org_id, allMissions);
        }

        // Fetch carryover (only on work days)
        const [carryover, rerollStatus] = await Promise.all([
          getCarryoverMissions(user.id),
          getRerollStatus(user.id),
        ]);
        carryoverTasks = carryover;
        rerollsLeft = rerollStatus.rerollsLeft;
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
        salesMissions={salesMissions}
        contentMissions={contentMissions}
        leadGenMissions={leadGenMissions}
        completedTitles={completedTitles}
        completedMarketingTitles={completedMarketingTitles}
        lifetimeXp={lifetimeXp}
        weeklyMktXp={weeklyMktXp}
        missionCategories={missionCategories}
        carryoverTasks={carryoverTasks}
        todayLabel={todayLabel}
        rerollsLeft={rerollsLeft}
      />
    </div>
  );
}
