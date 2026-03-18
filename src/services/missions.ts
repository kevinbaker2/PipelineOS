import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MissionTask, MarketingMissionType } from "@/types";
import { differenceInDays, parseISO, getWeek, getDay, startOfWeek, startOfDay, format, subDays } from "date-fns";

/** Any Supabase client (cookie-based or service-role). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any, any>;

function getClient(client?: DbClient): DbClient {
  return client ?? createClient();
}

export async function getUserWorkDays(userId: string, client?: DbClient): Promise<number[]> {
  const supabase = getClient(client);
  const { data } = await supabase
    .from("users")
    .select("work_days")
    .eq("id", userId)
    .single();
  return data?.work_days ?? [1, 2, 3, 4, 5];
}

export async function getUserMissionCategories(userId: string, client?: DbClient): Promise<string[]> {
  const supabase = getClient(client);
  const { data } = await supabase
    .from("users")
    .select("mission_categories")
    .eq("id", userId)
    .single();
  return data?.mission_categories ?? ["sales", "marketing"];
}

/**
 * Simple seeded PRNG (mulberry32). Returns a function that produces 0-1 values.
 */
function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  const rng = seededRandom(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getDaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

export type MissionIntensity = "normal" | "more" | "lighter";

function getXpBudget(intensity: MissionIntensity): number {
  switch (intensity) {
    case "lighter": return 60;
    case "more": return 150;
    default: return 100;
  }
}

export async function generateMissions(
  userId: string,
  intensity: MissionIntensity = "normal",
  client?: DbClient,
  orgId?: string,
): Promise<MissionTask[]> {
  const supabase = getClient(client);
  let query = supabase
    .from("leads")
    .select("*")
    .neq("phase", "Closed Won")
    .neq("phase", "Closed Lost");
  if (orgId) query = query.eq("org_id", orgId);
  const { data: leads } = await query;

  const activeLeads = leads ?? [];
  const now = new Date();
  const missions: MissionTask[] = [];

  // 1. Stagnation alerts: leads with no activity > 5 days
  const staleLeads = activeLeads
    .filter((l) => differenceInDays(now, parseISO(l.last_activity_at)) > 5)
    .sort((a, b) => Number(b.expected_mrr) - Number(a.expected_mrr))
    .slice(0, 3);

  staleLeads.forEach((lead) => {
    const daysSince = differenceInDays(now, parseISO(lead.last_activity_at));
    missions.push({
      id: `stale-${lead.id}`,
      type: "stagnation",
      title: `Re-engage ${lead.company_name}`,
      description: `No activity for ${daysSince} days. Expected MRR: $${Number(lead.expected_mrr).toLocaleString()}`,
      lead_id: lead.id,
      lead_name: lead.company_name,
      xp_value: 15,
      priority: daysSince > 10 ? "critical" : "high",
    });
  });

  // 2. Proposals > 7 days without movement
  const staleProposals = activeLeads
    .filter(
      (l) =>
        l.phase === "Proposal" &&
        differenceInDays(now, parseISO(l.last_activity_at)) > 7
    )
    .slice(0, 3);

  staleProposals.forEach((lead) => {
    missions.push({
      id: `proposal-${lead.id}`,
      type: "proposal",
      title: `Follow up on proposal: ${lead.company_name}`,
      description: `Proposal has been pending for over 7 days. Push for decision.`,
      lead_id: lead.id,
      lead_name: lead.company_name,
      xp_value: 20,
      priority: "high",
    });
  });

  // 3. Follow-ups needed (leads in Negotiation with high probability)
  const negotiationLeads = activeLeads
    .filter((l) => l.phase === "Negotiation" && l.probability >= 60)
    .slice(0, 2);

  negotiationLeads.forEach((lead) => {
    missions.push({
      id: `follow-${lead.id}`,
      type: "follow_up",
      title: `Close deal: ${lead.company_name}`,
      description: `${lead.probability}% probability, $${Number(lead.expected_mrr).toLocaleString()} MRR. Push to close.`,
      lead_id: lead.id,
      lead_name: lead.company_name,
      xp_value: 25,
      priority: "critical",
    });
  });

  // 4. Outreach targets (if pipeline is thin)
  if (activeLeads.length < 10) {
    const outreachCount = Math.min(10 - activeLeads.length, 3);
    for (let i = 0; i < outreachCount; i++) {
      missions.push({
        id: `outreach-${i}`,
        type: "outreach",
        title: `Source ${i + 1} new lead`,
        description: `Pipeline has only ${activeLeads.length} active deals. Target: 10+ active leads.`,
        xp_value: 10,
        priority: "medium",
      });
    }
  }

  // Sort by priority first, then apply daily shuffle within same priority
  missions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Apply daily seed shuffle to add variety (keeps priority groups but shuffles within)
  const seed = getDaySeed() + userId.charCodeAt(0);
  const shuffled = shuffleWithSeed(missions, seed);

  // Re-sort so critical/high stay on top, but medium/low get shuffled
  shuffled.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa <= 1 && pb <= 1) return pa - pb; // keep critical > high order
    if (pa <= 1) return -1;
    if (pb <= 1) return 1;
    return 0; // preserve shuffle order for medium/low
  });

  // Apply XP budget cap
  const budget = getXpBudget(intensity);
  const result: MissionTask[] = [];
  let spent = 0;
  for (const m of shuffled) {
    if (spent + m.xp_value > budget && result.length > 0) continue;
    result.push(m);
    spent += m.xp_value;
  }

  return result;
}

export async function getCompletedMissionTitles(userId?: string, client?: DbClient): Promise<string[]> {
  const supabase = getClient(client);
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("tasks")
    .select("title")
    .eq("due_date", today)
    .not("completed_at", "is", null);
  if (userId) query = query.eq("user_id", userId);

  const { data } = await query;
  return (data ?? []).map((t) => t.title);
}

export async function getTodayCompletedCount(userId: string, client?: DbClient): Promise<number> {
  const supabase = getClient(client);
  const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");

  const { count } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("due_date", todayStr)
    .not("completed_at", "is", null);

  return count ?? 0;
}

export async function getWeeklyXp(userId: string, client?: DbClient): Promise<number> {
  const supabase = getClient(client);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  const { data } = await supabase
    .from("tasks")
    .select("xp_value")
    .eq("user_id", userId)
    .gte("due_date", weekStartStr)
    .not("completed_at", "is", null);

  return (data ?? []).reduce((sum, t) => sum + t.xp_value, 0);
}

// ============================================
// MARKETING MISSIONS
// ============================================

type Frequency = "weekly" | "biweekly" | "monthly" | "quarterly";

interface StepDef {
  label: string;
  xp: number;
  dueRule: string; // e.g. "mon", "wed", "fri", "any", "wk1", "wk2", "wk3"
}

interface MarketingSchedule {
  type: MarketingMissionType;
  displayName: string;
  frequency: Frequency;
  steps: StepDef[];
}

const MARKETING_SCHEDULES: MarketingSchedule[] = [
  {
    type: "linkedin_article",
    displayName: "LinkedIn Article",
    frequency: "biweekly",
    steps: [
      { label: "Draft article", xp: 30, dueRule: "mon" },
      { label: "Polish & review", xp: 20, dueRule: "wed" },
      { label: "Publish article", xp: 15, dueRule: "fri" },
    ],
  },
  {
    type: "network_post",
    displayName: "Network Post",
    frequency: "weekly",
    steps: [
      { label: "Write & publish post", xp: 15, dueRule: "any" },
    ],
  },
  {
    type: "case_study",
    displayName: "Case Study",
    frequency: "monthly",
    steps: [
      { label: "Outline case study", xp: 25, dueRule: "wk1" },
      { label: "Write case study", xp: 35, dueRule: "wk2" },
      { label: "Publish case study", xp: 20, dueRule: "wk3" },
    ],
  },
  {
    type: "video_ad",
    displayName: "Video Ad",
    frequency: "monthly",
    steps: [
      { label: "Write script", xp: 30, dueRule: "wk1" },
      { label: "Record video", xp: 40, dueRule: "wk2" },
      { label: "Launch video ad", xp: 25, dueRule: "wk3" },
    ],
  },
  {
    type: "landing_page",
    displayName: "Landing Page",
    frequency: "quarterly",
    steps: [
      { label: "Write copy", xp: 30, dueRule: "wk1" },
      { label: "Build page", xp: 50, dueRule: "wk2" },
      { label: "Launch page", xp: 20, dueRule: "wk3" },
    ],
  },
];

function getCycleIdentifier(frequency: Frequency, now: Date): string {
  const year = now.getFullYear();
  const week = getWeek(now, { weekStartsOn: 1 });

  switch (frequency) {
    case "weekly":
      return `${year}-W${String(week).padStart(2, "0")}`;
    case "biweekly":
      return `${year}-BW${Math.ceil(week / 2)}`;
    case "monthly":
      return format(now, "yyyy-MM");
    case "quarterly": {
      const quarter = Math.ceil((now.getMonth() + 1) / 3);
      return `${year}-Q${quarter}`;
    }
  }
}

function buildStepTitle(type: string, cycleId: string, stepNum: number, label: string): string {
  return `[MKT:${type}:${cycleId}:Step${stepNum}] ${label}`;
}

function isStepDueNow(dueRule: string, frequency: Frequency, now: Date): boolean {
  const dayOfWeek = getDay(now); // 0=Sun, 1=Mon, ..., 6=Sat
  const dayInMonth = now.getDate();

  if (frequency === "weekly" || frequency === "biweekly") {
    switch (dueRule) {
      case "mon": return dayOfWeek === 1;
      case "tue": return dayOfWeek === 2;
      case "wed": return dayOfWeek === 3;
      case "thu": return dayOfWeek === 4;
      case "fri": return dayOfWeek === 5;
      case "any": return dayOfWeek >= 1 && dayOfWeek <= 5; // weekdays
      default: return false;
    }
  }

  // Monthly/quarterly: wk1 = days 1-7, wk2 = days 8-14, wk3 = days 15-21
  switch (dueRule) {
    case "wk1": return dayInMonth >= 1 && dayInMonth <= 7;
    case "wk2": return dayInMonth >= 8 && dayInMonth <= 14;
    case "wk3": return dayInMonth >= 15 && dayInMonth <= 21;
    default: return false;
  }
}

function isCycleActive(frequency: Frequency, now: Date): boolean {
  if (frequency === "biweekly") {
    const week = getWeek(now, { weekStartsOn: 1 });
    return week % 2 === 0; // even weeks only
  }
  return true;
}

export async function getCompletedMarketingTitles(userId?: string, client?: DbClient): Promise<string[]> {
  const supabase = getClient(client);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  let query = supabase
    .from("tasks")
    .select("title")
    .eq("category", "marketing")
    .gte("due_date", weekStartStr)
    .not("completed_at", "is", null);
  if (userId) query = query.eq("user_id", userId);

  const { data } = await query;
  return (data ?? []).map((t) => t.title);
}

export async function getWeeklyMarketingXp(userId: string, client?: DbClient): Promise<number> {
  const supabase = getClient(client);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  const { data } = await supabase
    .from("tasks")
    .select("xp_value")
    .eq("user_id", userId)
    .eq("category", "marketing")
    .gte("due_date", weekStartStr)
    .not("completed_at", "is", null);

  return (data ?? []).reduce((sum, t) => sum + t.xp_value, 0);
}

export async function generateMarketingMissions(userId: string, client?: DbClient): Promise<MissionTask[]> {
  const now = new Date();
  const completedTitles = await getCompletedMarketingTitles(userId, client);
  const completedSet = new Set(completedTitles);
  const missions: MissionTask[] = [];

  for (const schedule of MARKETING_SCHEDULES) {
    if (!isCycleActive(schedule.frequency, now)) continue;

    const cycleId = getCycleIdentifier(schedule.frequency, now);

    // Find the first incomplete step
    let nextStepIndex = -1;
    for (let i = 0; i < schedule.steps.length; i++) {
      const title = buildStepTitle(schedule.type, cycleId, i + 1, schedule.steps[i].label);
      if (!completedSet.has(title)) {
        nextStepIndex = i;
        break;
      }
    }

    // All steps complete for this cycle, or no incomplete step found
    if (nextStepIndex === -1) continue;

    const step = schedule.steps[nextStepIndex];

    // Only show if step is due now
    if (!isStepDueNow(step.dueRule, schedule.frequency, now)) continue;

    const title = buildStepTitle(schedule.type, cycleId, nextStepIndex + 1, step.label);

    missions.push({
      id: `mkt-${schedule.type}-${cycleId}-s${nextStepIndex + 1}`,
      type: schedule.type,
      title,
      description: `${schedule.displayName} — ${step.label}`,
      xp_value: step.xp,
      priority: nextStepIndex === schedule.steps.length - 1 ? "high" : "medium",
      category: "marketing",
      subcategory: "content",
      stepNumber: nextStepIndex + 1,
      totalSteps: schedule.steps.length,
      stepLabel: step.label,
    });

    // Cap at 3 content marketing missions
    if (missions.length >= 3) break;
  }

  return missions;
}

// ============================================
// LEAD GENERATION MISSIONS
// ============================================

interface LeadGenDef {
  type: MarketingMissionType;
  title: string;
  description: string;
  xp: number;
  priority: "low" | "medium" | "high" | "critical";
  timesPerWeek: number;
}

const LEAD_GEN_DEFS: LeadGenDef[] = [
  {
    type: "linkedin_engagement",
    title: "LinkedIn Engagement Check",
    description: "Check who liked or commented on your recent LinkedIn posts — add interesting profiles as a lead in PipelineOS",
    xp: 20,
    priority: "high",
    timesPerWeek: 2,
  },
  {
    type: "website_visitors",
    title: "Website Visitors Review",
    description: "Review this week's website visitors — identify warm prospects and add them as a lead in PipelineOS",
    xp: 20,
    priority: "medium",
    timesPerWeek: 1,
  },
  {
    type: "linkedin_prospecting",
    title: "LinkedIn Prospecting",
    description: "Find and connect with 3 new people in your target audience on LinkedIn",
    xp: 15,
    priority: "medium",
    timesPerWeek: 2,
  },
];

/**
 * Pick N days from the user's work_days array using a weekly seed so
 * the chosen days rotate each week instead of landing on the same days.
 * The defIndex parameter staggers different mission types apart.
 */
function pickDays(workDays: number[], count: number, defIndex: number, weekSeed: number): number[] {
  const sorted = [...workDays].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return [];
  if (count >= n) return sorted;

  const shuffled = shuffleWithSeed(sorted, weekSeed + defIndex * 7);
  return shuffled.slice(0, count);
}

export async function generateLeadGenMissions(userId: string, client?: DbClient): Promise<MissionTask[]> {
  const now = new Date();
  const weekNum = getWeek(now, { weekStartsOn: 1 });
  const cycleId = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  const todayDow = getDay(now); // 0=Sun, 1=Mon, ..., 6=Sat
  // Convert to ISO weekday: 1=Mon...7=Sun
  const todayIso = todayDow === 0 ? 7 : todayDow;

  // Weekly seed: changes each week so picked days rotate
  const weekSeed = now.getFullYear() * 100 + weekNum;

  const [workDays, completedTitles] = await Promise.all([
    getUserWorkDays(userId, client),
    getCompletedMarketingTitles(userId, client),
  ]);
  const completedSet = new Set(completedTitles);
  const missions: MissionTask[] = [];

  for (let defIdx = 0; defIdx < LEAD_GEN_DEFS.length; defIdx++) {
    const def = LEAD_GEN_DEFS[defIdx];
    const scheduledDays = pickDays(workDays, def.timesPerWeek, defIdx, weekSeed);

    // Only show if today is one of the scheduled days
    if (!scheduledDays.includes(todayIso)) continue;

    // Determine which occurrence this is (1st or 2nd time this week)
    const occurrenceIndex = scheduledDays.indexOf(todayIso);
    const title = `[LG:${def.type}:${cycleId}:${occurrenceIndex + 1}] ${def.title}`;

    // Skip if already completed this cycle
    if (completedSet.has(title)) continue;

    missions.push({
      id: `lg-${def.type}-${cycleId}-${occurrenceIndex + 1}`,
      type: def.type,
      title,
      description: def.description,
      xp_value: def.xp,
      priority: def.priority,
      category: "marketing",
      subcategory: "lead_generation",
    });
  }

  return missions;
}

// ============================================
// DAILY MISSION REFRESH
// ============================================

/**
 * Ensures the user always has 3-5 missions for the day across all
 * enabled categories. If fewer than 3 are generated by the standard
 * generators, filler missions are created. Prioritizes variety by
 * avoiding the same mission type two days in a row.
 */
export async function generateDailyMissions(
  userId: string,
  intensity: MissionIntensity = "normal",
  client?: DbClient,
  orgId?: string,
): Promise<{
  salesMissions: MissionTask[];
  contentMissions: MissionTask[];
  leadGenMissions: MissionTask[];
}> {
  const supabase = getClient(client);

  const [categories, salesRaw, content, leadGen, yesterdayTypes] = await Promise.all([
    getUserMissionCategories(userId, supabase),
    generateMissions(userId, intensity, supabase, orgId),
    generateMarketingMissions(userId, supabase),
    generateLeadGenMissions(userId, supabase),
    getYesterdayMissionTypes(userId, supabase),
  ]);

  const showSales = categories.includes("sales");
  const showMarketing = categories.includes("marketing");
  const showLeadGen = categories.includes("lead_generation");

  let salesMissions = showSales ? salesRaw : [];
  const contentMissions = showMarketing ? content : [];
  const leadGenMissions = showLeadGen ? leadGen : [];

  const totalMissions = salesMissions.length + contentMissions.length + leadGenMissions.length;

  // If we already have enough, apply variety filter and return
  if (totalMissions >= 3) {
    salesMissions = applyVarietyFilter(salesMissions, yesterdayTypes);
    return { salesMissions, contentMissions, leadGenMissions };
  }

  // Need to fill up to at least 3 missions. Generate filler sales missions.
  const needed = Math.min(5, Math.max(3, 5 - totalMissions)) - totalMissions;
  if (needed > 0 && showSales) {
    const fillerPool = getFillerMissions(yesterdayTypes);
    const seed = getDaySeed() + userId.charCodeAt(0);
    const shuffled = shuffleWithSeed(fillerPool, seed);
    const existingTypes = new Set(salesMissions.map((m) => m.type));

    for (const filler of shuffled) {
      if (salesMissions.length + contentMissions.length + leadGenMissions.length >= 3 + needed) break;
      // Avoid duplicating types already present
      if (existingTypes.has(filler.type)) continue;
      salesMissions.push(filler);
      existingTypes.add(filler.type);
    }
  }

  salesMissions = applyVarietyFilter(salesMissions, yesterdayTypes);
  return { salesMissions, contentMissions, leadGenMissions };
}

/**
 * Get the types of missions completed yesterday to avoid repeats.
 */
async function getYesterdayMissionTypes(userId: string, client: DbClient): Promise<Set<string>> {
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const { data } = await client
    .from("tasks")
    .select("title")
    .eq("user_id", userId)
    .eq("due_date", yesterday)
    .not("completed_at", "is", null);

  const types = new Set<string>();
  for (const t of data ?? []) {
    // Extract type from title patterns like "Re-engage X" → stagnation, "Follow up" → proposal, etc.
    if (t.title.startsWith("Re-engage")) types.add("stagnation");
    else if (t.title.startsWith("Follow up on proposal")) types.add("proposal");
    else if (t.title.startsWith("Close deal")) types.add("follow_up");
    else if (t.title.startsWith("Source")) types.add("outreach");
    else if (t.title.startsWith("[MKT:")) {
      const match = t.title.match(/\[MKT:([^:]+)/);
      if (match) types.add(match[1]);
    } else if (t.title.startsWith("[LG:")) {
      const match = t.title.match(/\[LG:([^:]+)/);
      if (match) types.add(match[1]);
    } else if (t.title.startsWith("Review pipeline")) types.add("pipeline_review");
    else if (t.title.startsWith("Update CRM")) types.add("crm_hygiene");
    else if (t.title.startsWith("Prep for")) types.add("meeting_prep");
  }
  return types;
}

/**
 * Deprioritize (move to end) missions whose type was completed yesterday.
 */
function applyVarietyFilter(missions: MissionTask[], yesterdayTypes: Set<string>): MissionTask[] {
  if (yesterdayTypes.size === 0) return missions;
  const fresh: MissionTask[] = [];
  const repeated: MissionTask[] = [];
  for (const m of missions) {
    if (yesterdayTypes.has(m.type)) {
      repeated.push(m);
    } else {
      fresh.push(m);
    }
  }
  return [...fresh, ...repeated];
}

/**
 * Generic filler missions for when the pipeline doesn't naturally
 * generate enough work for the day.
 */
function getFillerMissions(yesterdayTypes: Set<string>): MissionTask[] {
  const fillers: MissionTask[] = [
    {
      id: "filler-pipeline-review",
      type: "outreach" as const,
      title: "Review pipeline health",
      description: "Review your active deals and update any stale phases or probabilities.",
      xp_value: 10,
      priority: "medium",
    },
    {
      id: "filler-crm-hygiene",
      type: "outreach" as const,
      title: "Update CRM data",
      description: "Ensure all active leads have up-to-date contact info and notes.",
      xp_value: 10,
      priority: "low",
    },
    {
      id: "filler-meeting-prep",
      type: "follow_up" as const,
      title: "Prep for upcoming meetings",
      description: "Review leads you have meetings with this week and prepare talking points.",
      xp_value: 15,
      priority: "medium",
    },
  ];
  // Filter out types done yesterday
  return fillers.filter((f) => !yesterdayTypes.has(f.type));
}

/**
 * Persist today's generated missions to the tasks table so that
 * incomplete ones can be carried over to subsequent days.
 * Uses title + due_date + user_id to avoid duplicates.
 */
export async function persistTodayMissions(
  userId: string,
  orgId: string,
  missions: MissionTask[],
  client?: DbClient,
): Promise<void> {
  if (missions.length === 0) return;
  const supabase = getClient(client);
  const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");

  // Get titles already saved for today to avoid duplicates
  const { data: existing } = await supabase
    .from("tasks")
    .select("title")
    .eq("user_id", userId)
    .eq("due_date", todayStr);

  const existingTitles = new Set((existing ?? []).map((t) => t.title));

  const newTasks = missions
    .filter((m) => !existingTitles.has(m.title))
    .map((m) => ({
      org_id: orgId,
      user_id: userId,
      lead_id: m.lead_id || null,
      title: m.title,
      description: m.description,
      priority: m.priority,
      xp_value: m.xp_value,
      due_date: todayStr,
      completed_at: null,
      category: m.category ?? "sales",
    }));

  if (newTasks.length > 0) {
    await supabase.from("tasks").insert(newTasks);
  }
}

// ============================================
// CARRYOVER MISSIONS
// ============================================

export interface CarryoverTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  xp_value: number;
  due_date: string;
  lead_id: string | null;
  category: string | null;
}

export async function getCarryoverMissions(userId: string, client?: DbClient): Promise<CarryoverTask[]> {
  const supabase = getClient(client);
  const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
  // Look back up to 7 days for uncompleted tasks
  const lookbackStr = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const { data } = await supabase
    .from("tasks")
    .select("id, title, description, priority, xp_value, due_date, lead_id, category")
    .eq("user_id", userId)
    .is("completed_at", null)
    .lt("due_date", todayStr)
    .gte("due_date", lookbackStr)
    .order("due_date", { ascending: false });

  return (data ?? []) as CarryoverTask[];
}
