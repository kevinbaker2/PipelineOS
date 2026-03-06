import { NextRequest, NextResponse } from "next/server";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { differenceInDays, parseISO, getDay, getWeek, format } from "date-fns";

function getServiceClient() {
  return createJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const QUOTES = [
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Every 'no' brings you closer to a 'yes'.", author: "Mark Cuban" },
  { text: "Pipeline is vanity. Revenue is sanity.", author: "Sales Wisdom" },
  { text: "The fortune is in the follow-up.", author: "Jim Rohn" },
];

function getDailyQuote() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return QUOTES[dayOfYear % QUOTES.length];
}

function getLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}

interface EmailMission {
  title: string;
  description: string;
  xp: number;
  priority: string;
  category: string;
}

async function getMissionsForUser(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  orgId: string
): Promise<EmailMission[]> {
  const now = new Date();
  const missions: EmailMission[] = [];

  const { data: leads } = await supabase
    .from("leads")
    .select("id, company_name, expected_mrr, probability, phase, last_activity_at")
    .eq("org_id", orgId)
    .not("phase", "eq", "Closed Won")
    .not("phase", "eq", "Closed Lost");

  const activeLeads = leads ?? [];

  activeLeads
    .filter((l) => differenceInDays(now, parseISO(l.last_activity_at)) > 5)
    .sort((a, b) => Number(b.expected_mrr) - Number(a.expected_mrr))
    .slice(0, 3)
    .forEach((lead) => {
      const days = differenceInDays(now, parseISO(lead.last_activity_at));
      missions.push({
        title: `Re-engage ${lead.company_name}`,
        description: `No activity for ${days} days. Expected MRR: $${Number(lead.expected_mrr).toLocaleString()}`,
        xp: 15,
        priority: days > 10 ? "critical" : "high",
        category: "Sales",
      });
    });

  activeLeads
    .filter((l) => l.phase === "Proposal" && differenceInDays(now, parseISO(l.last_activity_at)) > 7)
    .slice(0, 3)
    .forEach((lead) => {
      missions.push({
        title: `Follow up on proposal: ${lead.company_name}`,
        description: "Proposal pending > 7 days — push for decision.",
        xp: 20,
        priority: "high",
        category: "Sales",
      });
    });

  activeLeads
    .filter((l) => l.phase === "Negotiation" && l.probability >= 60)
    .slice(0, 2)
    .forEach((lead) => {
      missions.push({
        title: `Close deal: ${lead.company_name}`,
        description: `${lead.probability}% probability, $${Number(lead.expected_mrr).toLocaleString()} MRR.`,
        xp: 25,
        priority: "critical",
        category: "Sales",
      });
    });

  if (activeLeads.length < 10) {
    const count = Math.min(10 - activeLeads.length, 3);
    for (let i = 0; i < count; i++) {
      missions.push({
        title: `Source ${i + 1} new lead`,
        description: `Pipeline has ${activeLeads.length} active deals. Target: 10+.`,
        xp: 10,
        priority: "medium",
        category: "Sales",
      });
    }
  }

  const todayDow = getDay(now);
  const todayIso = todayDow === 0 ? 7 : todayDow;
  const { data: userData } = await supabase
    .from("users")
    .select("work_days, mission_categories")
    .eq("id", userId)
    .single();
  const workDays: number[] = userData?.work_days ?? [1, 2, 3, 4, 5];
  const categories: string[] = userData?.mission_categories ?? ["sales", "marketing"];

  if (categories.includes("lead_generation") && workDays.includes(todayIso)) {
    missions.push({
      title: "LinkedIn Engagement Check",
      description: "Check who engaged with your recent posts — add interesting profiles as leads.",
      xp: 20,
      priority: "high",
      category: "Lead Generation",
    });
  }

  if (categories.includes("marketing")) {
    const weekNum = getWeek(now, { weekStartsOn: 1 });
    const isEvenWeek = weekNum % 2 === 0;
    if (isEvenWeek && todayDow === 1) {
      missions.push({
        title: "Draft LinkedIn Article",
        description: "Start this bi-weekly cycle's article.",
        xp: 30,
        priority: "medium",
        category: "Marketing",
      });
    }
    if (todayDow >= 1 && todayDow <= 5) {
      missions.push({
        title: "Write & publish network post",
        description: "Weekly network post — share an insight or update.",
        xp: 15,
        priority: "medium",
        category: "Marketing",
      });
    }
  }

  return missions;
}

function buildEmailHtml(
  name: string,
  quote: { text: string; author: string },
  missions: EmailMission[],
  xpTotal: number,
  level: number,
  appUrl: string
): string {
  const grouped: Record<string, EmailMission[]> = {};
  for (const m of missions) {
    (grouped[m.category] ??= []).push(m);
  }

  const priorityColors: Record<string, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#3b82f6",
    low: "#6b7280",
  };

  const missionRows = Object.entries(grouped)
    .map(([cat, items]) => {
      const rows = items
        .map(
          (m) => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #27272a;">
              <div style="font-weight:600;color:#fafafa;font-size:14px;">${m.title}</div>
              <div style="color:#a1a1aa;font-size:12px;margin-top:2px;">${m.description}</div>
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #27272a;text-align:center;white-space:nowrap;">
              <span style="color:${priorityColors[m.priority] ?? "#6b7280"};font-size:11px;font-weight:600;text-transform:uppercase;">${m.priority}</span>
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #27272a;text-align:right;white-space:nowrap;">
              <span style="color:#a78bfa;font-weight:700;font-size:13px;">+${m.xp} XP</span>
            </td>
          </tr>`
        )
        .join("");

      return `
        <tr>
          <td colspan="3" style="padding:16px 12px 6px;font-size:13px;font-weight:700;color:#a78bfa;text-transform:uppercase;letter-spacing:0.05em;">
            ${cat}
          </td>
        </tr>
        ${rows}`;
    })
    .join("");

  const totalXp = missions.reduce((s, m) => s + m.xp, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#18181b;border-radius:12px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:28px 24px 20px;text-align:center;border-bottom:1px solid #27272a;">
            <div style="display:inline-block;background:#7c3aed;border-radius:10px;padding:10px;margin-bottom:12px;">
              <span style="font-size:20px;">&#9889;</span>
            </div>
            <h1 style="margin:0;color:#fafafa;font-size:20px;font-weight:700;">Good morning, ${name}!</h1>
            <p style="margin:6px 0 0;color:#a1a1aa;font-size:13px;">Here&rsquo;s your mission briefing for ${format(new Date(), "EEEE, MMMM d")}</p>
          </td>
        </tr>

        <!-- Quote -->
        <tr>
          <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
            <div style="background:#1e1b4b;border-left:3px solid #7c3aed;border-radius:6px;padding:14px 16px;">
              <p style="margin:0;color:#c4b5fd;font-size:13px;font-style:italic;">&ldquo;${quote.text}&rdquo;</p>
              <p style="margin:6px 0 0;color:#7c73a3;font-size:11px;">&mdash; ${quote.author}</p>
            </div>
          </td>
        </tr>

        <!-- XP Stats -->
        <tr>
          <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;padding:8px;">
                  <div style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Lifetime XP</div>
                  <div style="color:#fafafa;font-size:24px;font-weight:700;margin-top:4px;">${xpTotal.toLocaleString()}</div>
                </td>
                <td style="text-align:center;padding:8px;">
                  <div style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Level</div>
                  <div style="color:#a78bfa;font-size:24px;font-weight:700;margin-top:4px;">${level}</div>
                </td>
                <td style="text-align:center;padding:8px;">
                  <div style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Today&rsquo;s XP</div>
                  <div style="color:#22c55e;font-size:24px;font-weight:700;margin-top:4px;">${totalXp}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Missions -->
        <tr>
          <td style="padding:4px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${missionRows}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:24px;text-align:center;">
            <a href="${appUrl}/missions" style="display:inline-block;background:#7c3aed;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
              Open PipelineOS &rarr;
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 24px;text-align:center;border-top:1px solid #27272a;">
            <p style="margin:0;color:#52525b;font-size:11px;">PipelineOS &middot; Test email</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// GET handler — ?email=user@example.com
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Missing ?email= query parameter" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const supabase = getServiceClient();

  // Look up user by email
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, org_id, full_name, email, xp_total")
    .eq("email", email)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: `User not found for email: ${email}` }, { status: 404 });
  }

  const resend = new Resend(resendKey);
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pipeline-os-rosy.vercel.app";
  const quote = getDailyQuote();
  const missions = await getMissionsForUser(supabase, user.id, user.org_id);
  const level = getLevel(user.xp_total ?? 0);
  const firstName = (user.full_name ?? "").split(" ")[0] || "there";

  const html = buildEmailHtml(firstName, quote, missions, user.xp_total ?? 0, level, appUrl);

  const { error: sendError } = await resend.emails.send({
    from: "PipelineOS <onboarding@resend.dev>",
    to: user.email,
    subject: `[TEST] Good morning ${firstName} — here's your PipelineOS mission briefing`,
    html,
  });

  if (sendError) {
    return NextResponse.json({ error: "Failed to send email", detail: sendError }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    sentTo: user.email,
    missionsCount: missions.length,
  });
}
