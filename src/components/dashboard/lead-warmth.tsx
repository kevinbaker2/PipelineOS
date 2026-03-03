"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Lead } from "@/types";
import Link from "next/link";

interface LeadWarmthProps {
  leads: Lead[];
}

export function LeadWarmth({ leads }: LeadWarmthProps) {
  const activeLeads = leads.filter(
    (l) => l.phase !== "Closed Won" && l.phase !== "Closed Lost"
  );

  const hot = activeLeads.filter((l) => l.score >= 70);
  const warm = activeLeads.filter((l) => l.score >= 40 && l.score < 70);
  const cold = activeLeads.filter((l) => l.score < 40);

  const buckets = [
    {
      label: "Hot",
      leads: hot,
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Warm",
      leads: warm,
      color: "bg-amber-500",
      textColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Cold",
      leads: cold,
      color: "bg-red-500",
      textColor: "text-red-400",
      bgColor: "bg-red-500/10",
    },
  ];

  const totalCount = activeLeads.length || 1;

  // Top 3 hottest leads across all active
  const topLeads = [...activeLeads]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Lead Warmth</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stacked bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
          {buckets.map((b) => (
            <div
              key={b.label}
              className={`${b.color} transition-all duration-500`}
              style={{ width: `${(b.leads.length / totalCount) * 100}%` }}
            />
          ))}
        </div>

        {/* Bucket stats */}
        <div className="grid grid-cols-3 gap-3">
          {buckets.map((b) => {
            const totalMrr = b.leads.reduce((s, l) => s + Number(l.expected_mrr), 0);
            return (
              <div key={b.label} className={`rounded-lg ${b.bgColor} p-3 text-center`}>
                <p className={`text-lg font-bold ${b.textColor}`}>{b.leads.length}</p>
                <p className="text-[10px] text-muted-foreground">{b.label}</p>
                <p className="mt-0.5 text-xs font-medium">{formatCurrency(totalMrr)}</p>
              </div>
            );
          })}
        </div>

        {/* Top 3 hottest */}
        {topLeads.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Hottest Leads</p>
            {topLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between rounded-lg border p-2 transition-colors hover:bg-muted/50"
              >
                <span className="text-sm font-medium truncate">{lead.company_name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(Number(lead.expected_mrr))}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      lead.score >= 70
                        ? "text-emerald-400"
                        : lead.score >= 40
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {lead.score}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
