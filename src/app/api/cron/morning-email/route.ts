import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";
import { getDailyQuote } from "@/lib/quotes";
import { getLevel } from "@/lib/utils";
import { buildEmailHtml, type EmailMission } from "@/lib/email-html";
import {
  generateMissions,
  generateMarketingMissions,
  generateLeadGenMissions,
  getUserMissionCategories,
} from "@/services/missions";

// ---------------------------------------------------------------------------
// Auth — only allow Vercel Cron (or manual calls with the secret)
// ---------------------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

// ---------------------------------------------------------------------------
// Collect missions for a single user via the shared generators
// ---------------------------------------------------------------------------

async function collectMissionsForEmail(
  userId: string,
  orgId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
): Promise<EmailMission[]> {
  const categories = await getUserMissionCategories(userId, client);
  const showSales = categories.includes("sales");
  const showMarketing = categories.includes("marketing");
  const showLeadGen = categories.includes("lead_generation");

  const [sales, marketing, leadGen] = await Promise.all([
    showSales ? generateMissions(userId, "normal", client, orgId) : Promise.resolve([]),
    showMarketing ? generateMarketingMissions(userId, client) : Promise.resolve([]),
    showLeadGen ? generateLeadGenMissions(userId, client) : Promise.resolve([]),
  ]);

  const missions: EmailMission[] = [];

  for (const m of sales) {
    missions.push({
      title: m.title,
      description: m.description,
      xp: m.xp_value,
      priority: m.priority,
      category: "Sales",
    });
  }
  for (const m of marketing) {
    missions.push({
      title: m.title,
      description: m.description,
      xp: m.xp_value,
      priority: m.priority,
      category: "Marketing",
    });
  }
  for (const m of leadGen) {
    missions.push({
      title: m.title,
      description: m.description,
      xp: m.xp_value,
      priority: m.priority,
      category: "Lead Generation",
    });
  }

  return missions;
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const supabase = createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pipeline-os-rosy.vercel.app";

  // Current day-of-week (ISO: 1=Mon..7=Sun)
  const now = new Date();
  const dow = now.getDay();
  const todayIso = dow === 0 ? 7 : dow;

  // Fetch all users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, org_id, full_name, email, xp_total, work_days");

  if (usersError || !users) {
    return NextResponse.json({ error: "Failed to fetch users", detail: usersError?.message }, { status: 500 });
  }

  // Filter to users whose work_days include today
  const eligibleUsers = users.filter((u) => {
    const workDays: number[] = u.work_days ?? [1, 2, 3, 4, 5];
    return workDays.includes(todayIso);
  });

  const quote = getDailyQuote();
  let sent = 0;
  let failed = 0;

  for (const user of eligibleUsers) {
    try {
      const missions = await collectMissionsForEmail(user.id, user.org_id, supabase);
      const level = getLevel(user.xp_total ?? 0);
      const firstName = (user.full_name ?? "").split(" ")[0] || "there";

      const html = buildEmailHtml(
        firstName,
        quote,
        missions,
        user.xp_total ?? 0,
        level,
        appUrl
      );

      await resend.emails.send({
        from: "PipelineOS <onboarding@resend.dev>",
        to: user.email,
        subject: `Good morning ${firstName} \u2014 here's your PipelineOS mission briefing \u{1F680}`,
        html,
      });

      sent++;
    } catch (err) {
      console.error(`[morning-email] Failed for ${user.email}:`, err);
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    totalUsers: users.length,
    eligible: eligibleUsers.length,
    sent,
    failed,
  });
}
