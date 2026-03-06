import { format } from "date-fns";
import { stripBracketPrefix } from "@/lib/utils";

export interface EmailMission {
  title: string;
  description: string;
  xp: number;
  priority: string;
  category: string;
}

export function buildEmailHtml(
  name: string,
  quote: { text: string; author: string },
  missions: EmailMission[],
  xpTotal: number,
  level: number,
  appUrl: string,
  footerLabel = "Your daily mission briefing",
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
              <div style="font-weight:600;color:#fafafa;font-size:14px;">${stripBracketPrefix(m.title)}</div>
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
            <p style="margin:0;color:#52525b;font-size:11px;">PipelineOS &middot; ${footerLabel}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
