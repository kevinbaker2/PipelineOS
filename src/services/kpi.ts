import { createClient } from "@/lib/supabase/server";
import type { KPIData, ForecastRow, PipelineHealthBreakdown, Lead } from "@/types";
import { addMonths, format, differenceInDays, parseISO } from "date-fns";

export async function getKPIData(): Promise<KPIData> {
  const supabase = createClient();
  const { data: leads } = await supabase.from("leads").select("*");
  const allLeads = leads ?? [];

  const wonLeads = allLeads.filter((l) => l.phase === "Closed Won");
  const lostLeads = allLeads.filter((l) => l.phase === "Closed Lost");
  const activeLeads = allLeads.filter(
    (l) => l.phase !== "Closed Won" && l.phase !== "Closed Lost"
  );

  const activeMRR = wonLeads.reduce((sum, l) => sum + Number(l.expected_mrr), 0);

  const weightedPipeline = activeLeads.reduce(
    (sum, l) => sum + Number(l.expected_mrr) * (l.probability / 100),
    0
  );

  const now = new Date();
  const next3Months = [0, 1, 2].map((i) =>
    format(addMonths(now, i), "yyyy-MM")
  );
  const forecast3Month = activeLeads
    .filter((l) => next3Months.includes(l.forecast_month))
    .reduce((sum, l) => sum + Number(l.expected_mrr) * (l.probability / 100), 0);

  const totalClosed = wonLeads.length + lostLeads.length;
  const closeRate = totalClosed > 0 ? (wonLeads.length / totalClosed) * 100 : 0;

  const closedLeads = [...wonLeads, ...lostLeads];
  const avgSalesCycle =
    closedLeads.length > 0
      ? closedLeads.reduce((sum, l) => {
          const created = parseISO(l.created_at);
          const lastAct = parseISO(l.last_activity_at);
          return sum + Math.max(differenceInDays(lastAct, created), 1);
        }, 0) / closedLeads.length
      : 0;

  const health = calculatePipelineHealth(allLeads);

  return {
    activeMRR,
    weightedPipeline,
    forecast3Month,
    closeRate,
    avgSalesCycle: Math.round(avgSalesCycle),
    healthScore: health.score,
  };
}

export function calculatePipelineHealth(leads: Lead[]): PipelineHealthBreakdown {
  const activeLeads = leads.filter(
    (l) => l.phase !== "Closed Won" && l.phase !== "Closed Lost"
  );
  const wonLeads = leads.filter((l) => l.phase === "Closed Won");
  const lostLeads = leads.filter((l) => l.phase === "Closed Lost");

  // Velocity: are deals moving? Check last_activity_at freshness
  const now = new Date();
  const staleCount = activeLeads.filter((l) => {
    const daysSince = differenceInDays(now, parseISO(l.last_activity_at));
    return daysSince > 7;
  }).length;
  const velocityScore =
    activeLeads.length > 0
      ? Math.round(((activeLeads.length - staleCount) / activeLeads.length) * 25)
      : 25;

  // Conversion: win rate
  const total = wonLeads.length + lostLeads.length;
  const winRate = total > 0 ? wonLeads.length / total : 0.5;
  const conversionScore = Math.round(Math.min(winRate * 50, 25));

  // Coverage: pipeline value vs target (3x coverage = 25 pts)
  const targetMRR = wonLeads.reduce((s, l) => s + Number(l.expected_mrr), 0) || 10000;
  const pipelineValue = activeLeads.reduce(
    (s, l) => s + Number(l.expected_mrr),
    0
  );
  const coverage = pipelineValue / targetMRR;
  const coverageScore = Math.round(Math.min((coverage / 3) * 25, 25));

  // Activity: score distribution quality
  const avgScore =
    activeLeads.length > 0
      ? activeLeads.reduce((s, l) => s + l.score, 0) / activeLeads.length
      : 50;
  const activityScore = Math.round((avgScore / 100) * 25);

  const score = velocityScore + conversionScore + coverageScore + activityScore;

  let explanation = "";
  if (score >= 80) explanation = "Pipeline is healthy with strong velocity and coverage.";
  else if (score >= 60)
    explanation = "Pipeline is moderate. Focus on moving stale deals and improving coverage.";
  else if (score >= 40)
    explanation = "Pipeline needs attention. Several deals are stagnant and coverage is thin.";
  else
    explanation = "Pipeline is at risk. Immediate action needed on deal velocity and lead generation.";

  return {
    score,
    velocityScore,
    conversionScore,
    coverageScore,
    activityScore,
    explanation,
  };
}

export async function getForecastData(): Promise<ForecastRow[]> {
  const supabase = createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .neq("phase", "Closed Won")
    .neq("phase", "Closed Lost");

  const activeLeads = leads ?? [];
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) =>
    format(addMonths(now, i), "yyyy-MM")
  );

  return months.map((month) => {
    const monthLeads = activeLeads.filter((l) => l.forecast_month === month);

    const best = monthLeads.reduce((sum, l) => sum + Number(l.expected_mrr), 0);
    const weighted = monthLeads.reduce(
      (sum, l) => sum + Number(l.expected_mrr) * (l.probability / 100),
      0
    );
    const conservative = monthLeads
      .filter((l) => l.probability >= 70)
      .reduce((sum, l) => sum + Number(l.expected_mrr) * (l.probability / 100), 0);

    return { month, best, weighted, conservative };
  });
}
