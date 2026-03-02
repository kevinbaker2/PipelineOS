"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Building2, Mail, Calendar, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Lead } from "@/types";
import { AddLeadDialog } from "@/components/dashboard/add-lead-dialog";

const phaseColors: Record<string, string> = {
  Discovery: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Qualification: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Proposal: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Negotiation: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Closed Won": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Closed Lost": "bg-red-500/10 text-red-400 border-red-500/20",
};

interface OrgUser {
  id: string;
  full_name: string;
}

interface LeadsTableProps {
  leads: Lead[];
  users: OrgUser[];
  phases: string[];
}

export function LeadsTable({ leads, users, phases }: LeadsTableProps) {
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((lead) => {
      if (
        q &&
        !lead.company_name.toLowerCase().includes(q) &&
        !lead.contact_name.toLowerCase().includes(q) &&
        !lead.email.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (phaseFilter !== "all" && lead.phase !== phaseFilter) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (assignedFilter !== "all" && lead.assigned_to !== assignedFilter)
        return false;
      return true;
    });
  }, [leads, search, phaseFilter, sourceFilter, assignedFilter]);

  const hasActiveFilters =
    search || phaseFilter !== "all" || sourceFilter !== "all" || assignedFilter !== "all";

  function clearFilters() {
    setSearch("");
    setPhaseFilter("all");
    setSourceFilter("all");
    setAssignedFilter("all");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {leads.length} leads
          </p>
        </div>
        <AddLeadDialog />
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by company, contact, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              {phases.map((phase) => (
                <SelectItem key={phase} value={phase}>
                  {phase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
            </SelectContent>
          </Select>
          {users.length > 0 && (
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Assigned to" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
            {leads.length === 0 ? (
              <>
                <p className="mb-2 text-lg font-medium">No leads yet</p>
                <p className="mb-6 text-sm text-muted-foreground">
                  Add your first lead to get started
                </p>
                <AddLeadDialog />
              </>
            ) : (
              <>
                <p className="mb-2 text-lg font-medium">No matching leads</p>
                <p className="mb-6 text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <div className="hidden items-center gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_80px]">
            <span>Company / Contact</span>
            <span>Phase</span>
            <span>MRR</span>
            <span>Probability</span>
            <span>Forecast</span>
            <span>Score</span>
          </div>
          {filtered.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="block border-b last:border-0 transition-colors hover:bg-muted/30"
            >
              <div className="grid items-center gap-4 px-4 py-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_80px]">
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
                <div>
                  <Badge
                    variant="outline"
                    className={phaseColors[lead.phase] || ""}
                  >
                    {lead.phase}
                  </Badge>
                </div>
                <div className="font-medium">
                  {formatCurrency(lead.expected_mrr)}
                </div>
                <div className="text-sm">{lead.probability}%</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {lead.forecast_month}
                </div>
                <div className="text-right">
                  <span
                    className={`font-bold ${
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
