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

  const supabase = createServiceClient();

  // Look up user by email
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, org_id, full_name, email, xp_total")
    .eq("email", email)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: `User not found for email: ${email}` }, { status: 404 });
  }

  // Generate missions using the same shared functions as /missions page
  const categories = await getUserMissionCategories(user.id, supabase);
  const showSales = categories.includes("sales");
  const showMarketing = categories.includes("marketing");
  const showLeadGen = categories.includes("lead_generation");

  const [sales, marketing, leadGen] = await Promise.all([
    showSales ? generateMissions(user.id, "normal", supabase, user.org_id) : Promise.resolve([]),
    showMarketing ? generateMarketingMissions(user.id, supabase) : Promise.resolve([]),
    showLeadGen ? generateLeadGenMissions(user.id, supabase) : Promise.resolve([]),
  ]);

  const missions: EmailMission[] = [];
  for (const m of sales) {
    missions.push({ title: m.title, description: m.description, xp: m.xp_value, priority: m.priority, category: "Sales" });
  }
  for (const m of marketing) {
    missions.push({ title: m.title, description: m.description, xp: m.xp_value, priority: m.priority, category: "Marketing" });
  }
  for (const m of leadGen) {
    missions.push({ title: m.title, description: m.description, xp: m.xp_value, priority: m.priority, category: "Lead Generation" });
  }

  const resend = new Resend(resendKey);
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pipeline-os-rosy.vercel.app";
  const quote = getDailyQuote();
  const level = getLevel(user.xp_total ?? 0);
  const firstName = (user.full_name ?? "").split(" ")[0] || "there";

  const html = buildEmailHtml(firstName, quote, missions, user.xp_total ?? 0, level, appUrl, "Test email");

  const { error: sendError } = await resend.emails.send({
    from: "PipelineOS <onboarding@resend.dev>",
    to: user.email,
    subject: `[TEST] Good morning ${firstName} \u2014 here's your PipelineOS mission briefing`,
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
