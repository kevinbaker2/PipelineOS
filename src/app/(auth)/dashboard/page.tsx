import { getKPIData, calculatePipelineHealth } from "@/services/kpi";
import { getLeadsByPhase } from "@/services/leads";
import { getPhaseSettings } from "@/services/scoring";
import { createClient } from "@/lib/supabase/server";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { PipelineHealth } from "@/components/dashboard/pipeline-health";
import { AddLeadDialog } from "@/components/dashboard/add-lead-dialog";
import type { PhaseSetting } from "@/types";
import { DEFAULT_PHASES } from "@/types";

export default async function DashboardPage() {
  let kpiData, leadsByPhase, phases, healthData;

  try {
    const supabase = createClient();
    const { data: leads } = await supabase.from("leads").select("*");

    kpiData = await getKPIData();
    leadsByPhase = await getLeadsByPhase();
    healthData = calculatePipelineHealth(leads ?? []);

    const dbPhases = await getPhaseSettings();
    phases =
      dbPhases.length > 0
        ? dbPhases
        : (DEFAULT_PHASES.map((p, i) => ({
            ...p,
            id: `default-${i}`,
            org_id: "",
          })) as PhaseSetting[]);
  } catch {
    // Fallback for when DB is not connected
    kpiData = {
      activeMRR: 42500,
      weightedPipeline: 128750,
      forecast3Month: 87200,
      closeRate: 34.5,
      avgSalesCycle: 28,
      healthScore: 72,
    };
    leadsByPhase = {};
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

      <KPICards data={kpiData} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Pipeline</h2>
          <KanbanBoard leadsByPhase={leadsByPhase} phases={phases} />
        </div>
        <div>
          <PipelineHealth data={healthData} />
        </div>
      </div>
    </div>
  );
}
