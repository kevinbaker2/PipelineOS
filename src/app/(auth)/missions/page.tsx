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
import type { MissionIntensity } from "@/services/missions";
import { getUserXpTotal } from "@/services/leaderboard";
import { MissionList } from "@/components/missions/mission-list";
import { MarketingMissionList } from "@/components/missions/marketing-mission-list";
import { getDailyQuote } from "@/lib/quotes";
import type { MissionTask } from "@/types";
import type { CarryoverTask } from "@/services/missions";
import Link from "next/link";
import { format } from "date-fns";

interface MissionsPageProps {
  searchParams: Promise<{ intensity?: string }>;
}

export default async function MissionsPage({ searchParams }: MissionsPageProps) {
  const params = await searchParams;
  const intensity = (
    ["normal", "more", "lighter"].includes(params.intensity ?? "")
      ? params.intensity
      : "normal"
  ) as MissionIntensity;

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
        salesMissions = [];
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
          showSales ? generateMissions(user.id, intensity) : Promise.resolve([]),
          showSales ? getCompletedMissionTitles() : Promise.resolve([]),
          getUserXpTotal(user.id),
          showMarketing ? generateMarketingMissions(user.id) : Promise.resolve([]),
          showLeadGen ? generateLeadGenMissions(user.id) : Promise.resolve([]),
          needMktData ? getCompletedMarketingTitles() : Promise.resolve([]),
          needMktData ? getWeeklyMarketingXp(user.id) : Promise.resolve(0),
        ]);

        salesMissions = sales;
        completedTitles = salesCompleted;
        lifetimeXp = xp;
        contentMissions = content;
        leadGenMissions = leadGen;
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
  const allTodayMissions = [
    ...salesMissions,
    ...contentMissions,
    ...leadGenMissions,
  ];
  const totalTodayXp = allTodayMissions.reduce((s, m) => s + m.xp_value, 0);

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

        {/* Show carryover even on day off */}
        {carryoverTasks.length > 0 && (
          <CarryoverSection tasks={carryoverTasks} />
        )}
      </div>
    );
  }

  const showSales = missionCategories.includes("sales");
  const showMarketing = missionCategories.includes("marketing");
  const showLeadGen = missionCategories.includes("lead_generation");

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

      {/* Today's Focus header + intensity buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today&apos;s Focus</h1>
          <p className="text-sm text-muted-foreground">
            {todayLabel} &middot; {allTodayMissions.length} missions &middot; {totalTodayXp} XP
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={intensity === "lighter" ? "/missions" : "/missions?intensity=lighter"}
            className={`inline-block rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              intensity === "lighter"
                ? "border-sky-500/50 bg-sky-500/10 text-sky-400"
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Lighter day today
          </Link>
          <Link
            href={intensity === "more" ? "/missions" : "/missions?intensity=more"}
            className={`inline-block rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              intensity === "more"
                ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            I want to do more today
          </Link>
        </div>
      </div>

      {/* Carryover tasks */}
      {carryoverTasks.length > 0 && (
        <CarryoverSection tasks={carryoverTasks} />
      )}

      {showSales && (
        <MissionList
          missions={salesMissions}
          completedTitles={completedTitles}
          lifetimeXp={lifetimeXp}
        />
      )}

      {showLeadGen && leadGenMissions.length > 0 && (
        <div className="border-t border-border pt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">{"\uD83C\uDFAF"} Lead Generation</h2>
            <p className="text-sm text-muted-foreground">
              LinkedIn engagement, prospecting &amp; website visitor follow-ups
            </p>
          </div>
          <MarketingMissionList
            missions={leadGenMissions}
            completedTitles={completedMarketingTitles}
            weeklyXp={weeklyMktXp}
          />
        </div>
      )}

      {showMarketing && (
        <div className="border-t border-border pt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">{"\uD83D\uDCE3"} Content &amp; Marketing</h2>
            <p className="text-sm text-muted-foreground">
              Weekly &amp; monthly content workflows with step-by-step progress
            </p>
          </div>
          <MarketingMissionList
            missions={contentMissions}
            completedTitles={completedMarketingTitles}
            weeklyXp={weeklyMktXp}
          />
        </div>
      )}
    </div>
  );
}

function CarryoverSection({ tasks }: { tasks: CarryoverTask[] }) {
  const totalCarryXp = tasks.reduce((s, t) => s + t.xp_value, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-amber-400">&#x26A0;&#xFE0F;</span>
        <h2 className="text-base font-semibold text-amber-400">
          Carried Over ({tasks.length})
        </h2>
        <span className="text-xs text-muted-foreground">
          +{totalCarryXp} XP unclaimed
        </span>
      </div>
      <div className="grid gap-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <span className="text-xs font-bold text-amber-400">!</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{task.title}</p>
              <p className="text-xs text-muted-foreground">
                Due {task.due_date} &middot; {task.priority}
              </p>
            </div>
            <span className="shrink-0 text-xs font-bold text-amber-400">
              +{task.xp_value} XP
            </span>
            {task.lead_id && (
              <Link href={`/leads/${task.lead_id}`}>
                <button className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50">
                  View
                </button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
