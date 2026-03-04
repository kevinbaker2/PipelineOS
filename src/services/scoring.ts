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
    { category: "firmographic", key: "company_size", label: "Company size 50+", max_points: 15 },
    { category: "firmographic", key: "industry_fit", label: "Industry fit", max_points: 15 },
    { category: "firmographic", key: "own_product", label: "Has own product", max_points: 10 },
    { category: "firmographic", key: "geography", label: "Target geography", max_points: 10 },
    { category: "engagement", key: "meetings_held", label: "Meetings held", max_points: 15 },
    { category: "engagement", key: "decision_maker", label: "Decision maker access", max_points: 10 },
    { category: "engagement", key: "inbound_lead", label: "Inbound lead", max_points: 10 },
    { category: "strategic", key: "scaling", label: "Scaling or hiring", max_points: 15 },
    { category: "strategic", key: "no_competitor", label: "No incumbent competitor", max_points: 10 },
    { category: "strategic", key: "budget_confirmed", label: "Budget confirmed", max_points: 10 },
    { category: "strategic", key: "urgency", label: "Urgent timeline", max_points: 5 },
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
