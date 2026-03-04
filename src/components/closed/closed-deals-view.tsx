"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  Mail,
  DollarSign,
  Trophy,
  Clock,
  TrendingDown,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import type { Lead } from "@/types";
import { differenceInDays, parseISO, format } from "date-fns";

interface ClosedUser {
  id: string;
  full_name: string;
}

interface ClosedDealsViewProps {
  won: Lead[];
  lost: Lead[];
  users: ClosedUser[];
}

export function ClosedDealsView({ won, lost, users }: ClosedDealsViewProps) {
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => map.set(u.id, u.full_name));
    return map;
  }, [users]);

  const stats = useMemo(() => {
    const totalWonMRR = won.reduce((s, l) => s + Number(l.expected_mrr), 0);
    const cycles = won.map((l) =>
      differenceInDays(parseISO(l.last_activity_at), parseISO(l.created_at))
    );
    const avgCycle =
      cycles.length > 0
        ? Math.round(cycles.reduce((s, d) => s + d, 0) / cycles.length)
        : 0;
    return { totalWonMRR, wonCount: won.length, avgCycle };
  }, [won]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Won MRR</p>
              <p className="text-xl font-bold text-emerald-400">
                {formatCurrency(stats.totalWonMRR)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deals Won</p>
              <p className="text-xl font-bold">{stats.wonCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Sales Cycle</p>
              <p className="text-xl font-bold">{stats.avgCycle} days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="won">
        <TabsList>
          <TabsTrigger value="won" className="gap-1.5">
            Closed Won
            <Badge
              variant="outline"
              className="ml-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            >
              {won.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="lost" className="gap-1.5">
            Closed Lost
            <Badge
              variant="outline"
              className="ml-1 bg-red-500/10 text-red-400 border-red-500/20"
            >
              {lost.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="won" className="mt-4">
          <DealsTable leads={won} userMap={userMap} variant="won" />
        </TabsContent>
        <TabsContent value="lost" className="mt-4">
          <DealsTable leads={lost} userMap={userMap} variant="lost" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DealsTable({
  leads,
  userMap,
  variant,
}: {
  leads: Lead[];
  userMap: Map<string, string>;
  variant: "won" | "lost";
}) {
  if (leads.length === 0) {
    const Icon = variant === "won" ? Trophy : TrendingDown;
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Icon className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="mb-2 text-lg font-medium">
            No {variant === "won" ? "won" : "lost"} deals yet
          </p>
          <p className="text-sm text-muted-foreground">
            Deals will appear here once they are closed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile: card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {leads.map((lead) => {
          const closeDate = format(new Date(lead.last_activity_at), "dd MMM yyyy");

          return (
            <Link key={lead.id} href={`/leads/${lead.id}`}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium truncate">{lead.company_name}</span>
                    </div>
                    <span
                      className={`shrink-0 ml-2 text-sm font-bold ${
                        variant === "won" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {formatCurrency(Number(lead.expected_mrr))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {lead.contact_name}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={
                        variant === "won"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }
                    >
                      {variant === "won" ? "Won" : "Lost"}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {closeDate}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block rounded-lg border">
        <div className="grid items-center gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <span>Company / Contact</span>
          <span>MRR</span>
          <span>Close Date</span>
          <span>Sales Cycle</span>
          <span>Assigned To</span>
        </div>
        {leads.map((lead) => {
          const cycleDays = differenceInDays(
            parseISO(lead.last_activity_at),
            parseISO(lead.created_at)
          );
          const closeDate = format(new Date(lead.last_activity_at), "dd MMM yyyy");
          const assignedName = lead.assigned_to
            ? userMap.get(lead.assigned_to) ?? "Unassigned"
            : "Unassigned";

          return (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="block border-b last:border-0 transition-colors hover:bg-muted/30"
            >
              <div className="grid items-center gap-4 px-4 py-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{lead.company_name}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{lead.contact_name}</span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {lead.email}
                    </span>
                  </div>
                </div>
                <div
                  className={`font-medium ${
                    variant === "won" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(Number(lead.expected_mrr))}
                </div>
                <div className="text-sm text-muted-foreground">{closeDate}</div>
                <div className="text-sm">
                  {cycleDays} <span className="text-muted-foreground">days</span>
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {assignedName}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
