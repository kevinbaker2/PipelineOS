export type UserRole = "admin" | "sales";
export type LeadSource = "inbound" | "outbound";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type ActivityType = "call" | "email" | "meeting" | "note" | "proposal" | "follow_up";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  work_days: number[];
  mission_categories: string[];
  created_at: string;
}

export interface Lead {
  id: string;
  org_id: string;
  company_name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  source_note?: string;
  phase: string;
  sector: string;
  country: string;
  source: LeadSource;
  expected_mrr: number;
  probability: number;
  forecast_month: string;
  score: number;
  score_details: string[];
  notes?: string;
  assigned_to?: string;
  created_at: string;
  last_activity_at: string;
}

export interface Task {
  id: string;
  org_id: string;
  user_id: string;
  lead_id?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  xp_value: number;
  due_date: string;
  completed_at?: string;
  created_at: string;
  lead?: Lead;
}

export interface Activity {
  id: string;
  org_id: string;
  lead_id: string;
  user_id: string;
  type: ActivityType;
  notes: string;
  created_at: string;
  user?: User;
}

export interface PhaseSetting {
  id: string;
  org_id: string;
  name: string;
  order: number;
  color: string;
  target_days: number;
}

export interface ScoringSetting {
  id: string;
  org_id: string;
  category: "firmographic" | "engagement" | "strategic";
  key: string;
  label: string;
  max_points: number;
}

export interface TeamNote {
  id: string;
  org_id: string;
  user_id: string;
  content: string;
  color: string;
  created_at: string;
  user_name?: string;
}

export interface KPIData {
  activeMRR: number;
  weightedPipeline: number;
  forecast3Month: number;
  closeRate: number;
  avgSalesCycle: number;
  healthScore: number;
}

export interface ForecastRow {
  month: string;
  best: number;
  weighted: number;
  conservative: number;
}

export interface PipelineHealthBreakdown {
  score: number;
  velocityScore: number;
  conversionScore: number;
  coverageScore: number;
  activityScore: number;
  explanation: string;
}

export type SalesMissionType = "stagnation" | "follow_up" | "proposal" | "outreach";
export type MarketingMissionType = "linkedin_article" | "network_post" | "case_study" | "video_ad" | "landing_page" | "linkedin_engagement" | "website_visitors" | "linkedin_prospecting";

export interface MissionTask {
  id: string;
  type: SalesMissionType | MarketingMissionType;
  title: string;
  description: string;
  lead_id?: string;
  lead_name?: string;
  xp_value: number;
  priority: TaskPriority;
  category?: "sales" | "marketing";
  subcategory?: "content" | "lead_generation";
  stepNumber?: number;
  totalSteps?: number;
  stepLabel?: string;
}

export const DEFAULT_PHASES: Omit<PhaseSetting, "id" | "org_id">[] = [
  { name: "Discovery", order: 1, color: "#6366f1", target_days: 14 },
  { name: "Qualification", order: 2, color: "#8b5cf6", target_days: 10 },
  { name: "Proposal", order: 3, color: "#f59e0b", target_days: 7 },
  { name: "Negotiation", order: 4, color: "#f97316", target_days: 7 },
  { name: "Closed Won", order: 5, color: "#22c55e", target_days: 0 },
  { name: "Closed Lost", order: 6, color: "#ef4444", target_days: 0 },
];
