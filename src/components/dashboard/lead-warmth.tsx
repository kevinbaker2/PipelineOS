"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lead } from "@/types";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";

interface LeadWarmthProps {
  leads: Lead[];
}

const tiers = [
  { phase: "Discovery", label: "Cold", emoji: "\u2744\uFE0F", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", headerBg: "bg-blue-500/15" },
  { phase: "Qualification", label: "Lukewarm", emoji: "\u26C5", color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/30", headerBg: "bg-sky-400/15" },
  { phase: "Proposal", label: "Warm", emoji: "\u2600\uFE0F", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", headerBg: "bg-orange-400/15" },
  { phase: "Negotiation", label: "Toasty", emoji: "\uD83D\uDD25", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", headerBg: "bg-red-500/15" },
  { phase: "Closed Won", label: "Fire", emoji: "\uD83D\uDE80", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", headerBg: "bg-purple-500/15" },
  { phase: "Closed Lost", label: "Lost", emoji: "\u274C", color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/30", headerBg: "bg-gray-500/15" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function LeadWarmth({ leads }: LeadWarmthProps) {
  const now = new Date();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Lead Warmth</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Horizontal scroll container — tiers as columns left-to-right */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {tiers.map((tier) => {
            const tierLeads = leads.filter((l) => l.phase === tier.phase);
            return (
              <div
                key={tier.phase}
                className="flex w-48 min-w-[192px] shrink-0 flex-col"
              >
                {/* Tier header */}
                <div className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 ${tier.headerBg}`}>
                  <span className="text-base">{tier.emoji}</span>
                  <span className={`text-sm font-semibold ${tier.color}`}>
                    {tier.label}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {tierLeads.length}
                  </span>
                </div>

                {/* Vertical stack of lead cards */}
                <div className="flex flex-col gap-2">
                  {tierLeads.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground italic">
                      No leads here
                    </p>
                  ) : (
                    tierLeads.map((lead) => {
                      const daysInPhase = differenceInDays(
                        now,
                        parseISO(lead.last_activity_at)
                      );
                      return (
                        <Link
                          key={lead.id}
                          href={`/leads/${lead.id}`}
                          className={`rounded-lg border p-2.5 transition-colors hover:bg-muted/50 ${tier.border} ${tier.bg}`}
                        >
                          <p className="truncate text-sm font-medium">
                            {lead.company_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {lead.contact_name}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{daysInPhase}d in phase</span>
                            <span>{timeAgo(lead.last_activity_at)}</span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
