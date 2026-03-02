import { createClient } from "@/lib/supabase/server";
import type { ScoringSetting } from "@/types";

export interface ScoreBreakdown {
  firmographic: number;
  engagement: number;
  strategic: number;
  total: number;
  maxPossible: number;
  details: { key: string; label: string; score: number; max: number }[];
}

export async function getScoringSettings(): Promise<ScoringSetting[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("scoring_settings")
    .select("*")
    .order("category");

  if (error) throw error;
  return data ?? [];
}

export function getDefaultScoringCriteria(): Omit<ScoringSetting, "id" | "org_id">[] {
  return [
    { category: "firmographic", key: "company_size", label: "Company Size (50+ employees)", max_points: 15 },
    { category: "firmographic", key: "industry_fit", label: "Industry Fit", max_points: 15 },
    { category: "firmographic", key: "geography", label: "Target Geography", max_points: 10 },
    { category: "firmographic", key: "budget_authority", label: "Budget Authority Confirmed", max_points: 10 },
    { category: "engagement", key: "response_time", label: "Response Time < 24h", max_points: 10 },
    { category: "engagement", key: "meetings_held", label: "Multiple Meetings Held", max_points: 10 },
    { category: "engagement", key: "stakeholder_access", label: "Decision Maker Access", max_points: 10 },
    { category: "strategic", key: "expansion_potential", label: "Expansion Potential", max_points: 10 },
    { category: "strategic", key: "competitive_position", label: "No Incumbent Competitor", max_points: 5 },
    { category: "strategic", key: "timeline_urgency", label: "Urgent Timeline", max_points: 5 },
  ];
}

export async function getPhaseSettings() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("phase_settings")
    .select("*")
    .order("order");

  if (error) throw error;
  return data ?? [];
}
