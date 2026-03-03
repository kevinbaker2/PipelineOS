import { calculatePipelineHealth } from "@/services/kpi";
import { getLeadsByPhase, getLeads } from "@/services/leads";
import { getPhaseSettings } from "@/services/scoring";
import { getUserXpTotal } from "@/services/leaderboard";
import { generateMissions, getCompletedMissionTitles, getTodayCompletedCount, getWeeklyXp } from "@/services/missions";
import { getTeamNotes } from "@/services/notes";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { PipelineHealth } from "@/components/dashboard/pipeline-health";
import { AddLeadDialog } from "@/components/dashboard/add-lead-dialog";
import { PersonalStatsBar } from "@/components/dashboard/personal-stats-bar";
import { DashboardMissions } from "@/components/dashboard/dashboard-missions";
import { LeadWarmth } from "@/components/dashboard/lead-warmth";
import { MotivationBoard } from "@/components/dashboard/motivation-board";
import type { PhaseSetting, Lead, MissionTask, TeamNote } from "@/types";
import { DEFAULT_PHASES } from "@/types";

export default async function DashboardPage() {
  let leadsByPhase: Record<string, Lead[]>;
  let phases: PhaseSetting[];
  let healthData;
  let lifetimeXp = 0;
  let missions: MissionTask[] = [];
  let completedTitles: string[] = [];
  let todayCompleted = 0;
  let weeklyXp = 0;
  let teamNotes: TeamNote[] = [];
  let allLeads: Lead[] = [];
  let currentUserId = "";

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user?.id ?? "";

    const [
      leadsByPhaseResult,
      allLeadsResult,
      dbPhases,
      xpTotal,
      missionsResult,
      completedResult,
      todayResult,
      weeklyResult,
      notesResult,
    ] = await Promise.all([
      getLeadsByPhase(),
      getLeads(),
      getPhaseSettings(),
      currentUserId ? getUserXpTotal(currentUserId) : Promise.resolve(0),
      currentUserId ? generateMissions(currentUserId) : Promise.resolve([]),
      getCompletedMissionTitles(),
      currentUserId ? getTodayCompletedCount(currentUserId) : Promise.resolve(0),
      currentUserId ? getWeeklyXp(currentUserId) : Promise.resolve(0),
      getTeamNotes(),
    ]);

    leadsByPhase = leadsByPhaseResult;
    allLeads = allLeadsResult;
    healthData = calculatePipelineHealth(allLeads);
    lifetimeXp = xpTotal;
    missions = missionsResult;
    completedTitles = completedResult;
    todayCompleted = todayResult;
    weeklyXp = weeklyResult;
    teamNotes = notesResult;

    phases =
      dbPhases.length > 0
        ? dbPhases
        : (DEFAULT_PHASES.map((p, i) => ({
            ...p,
            id: `default-${i}`,
            org_id: "",
          })) as PhaseSetting[]);
  } catch {
    leadsByPhase = {};
    allLeads = [];
    healthData = {
      score: 72,
      velocityScore: 20,
      conversionScore: 18,
      coverageScore: 16,
      activityScore: 18,
      explanation:
        "Pipeline is moderate. Focus on moving stale deals and improving coverage.",
    };
    phases = DEFAULT_PHASES.map((p, i) => ({
      ...p,
      id: `default-${i}`,
      org_id: "",
    })) as PhaseSetting[];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your pipeline at a glance
          </p>
        </div>
        <AddLeadDialog />
      </div>

      {/* Row 1: Lead Warmth (full width) */}
      <LeadWarmth leads={allLeads} />

      {/* Row 2: Kanban (65%) + Team Board (35%) */}
      <div className="grid gap-6 lg:grid-cols-[65fr_35fr]">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Pipeline</h2>
          <KanbanBoard leadsByPhase={leadsByPhase} phases={phases} />
        </div>
        <MotivationBoard notes={teamNotes} currentUserId={currentUserId} />
      </div>

      {/* Row 3: Missions (50%) + XP Stats & Health (50%) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardMissions missions={missions} completedTitles={completedTitles} />
        <div className="space-y-6">
          <PersonalStatsBar
            lifetimeXp={lifetimeXp}
            todayCompleted={todayCompleted}
            todayTotal={missions.length}
            weeklyXp={weeklyXp}
          />
          <PipelineHealth data={healthData} />
        </div>
      </div>
    </div>
  );
}
