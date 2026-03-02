"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Calendar,
  DollarSign,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, cn } from "@/lib/utils";
import { updateLead, deleteLead, addActivity, updateLeadScore } from "@/actions/leads";
import type { Lead, Activity, ActivityType, ScoringSetting } from "@/types";
import Link from "next/link";

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
  { value: "proposal", label: "Proposal" },
  { value: "follow_up", label: "Follow-up" },
];

const activityIcons: Record<string, string> = {
  call: "\u{1F4DE}",
  email: "\u{2709}\u{FE0F}",
  meeting: "\u{1F91D}",
  note: "\u{1F4DD}",
  proposal: "\u{1F4CB}",
  follow_up: "\u{1F504}",
};

const categoryLabels: Record<string, string> = {
  firmographic: "Firmographic",
  engagement: "Engagement",
  strategic: "Strategic Fit",
};

const categoryColors: Record<string, string> = {
  firmographic: "text-blue-400",
  engagement: "text-purple-400",
  strategic: "text-amber-400",
};

interface LeadDetailViewProps {
  lead: Lead;
  activities: Activity[];
  scoringSettings: ScoringSetting[];
}

export function LeadDetailView({ lead, activities, scoringSettings }: LeadDetailViewProps) {
  const router = useRouter();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set(lead.score_details || [])
  );

  const { totalScore, maxScore, categoryScores } = useMemo(() => {
    let total = 0;
    let max = 0;
    const cats: Record<string, { earned: number; max: number }> = {
      firmographic: { earned: 0, max: 0 },
      engagement: { earned: 0, max: 0 },
      strategic: { earned: 0, max: 0 },
    };

    for (const setting of scoringSettings) {
      max += setting.max_points;
      cats[setting.category].max += setting.max_points;
      if (checkedIds.has(setting.id)) {
        total += setting.max_points;
        cats[setting.category].earned += setting.max_points;
      }
    }

    // Normalize to 0-100 scale
    const normalized = max > 0 ? Math.round((total / max) * 100) : 0;

    return { totalScore: normalized, maxScore: max, categoryScores: cats };
  }, [checkedIds, scoringSettings]);

  const scoreColor =
    totalScore >= 70
      ? "text-emerald-400"
      : totalScore >= 40
      ? "text-amber-400"
      : "text-red-400";

  const progressColor =
    totalScore >= 70
      ? "[&>div]:bg-emerald-500"
      : totalScore >= 40
      ? "[&>div]:bg-amber-500"
      : "[&>div]:bg-red-500";

  async function toggleCriterion(settingId: string) {
    const next = new Set(checkedIds);
    if (next.has(settingId)) {
      next.delete(settingId);
    } else {
      next.add(settingId);
    }
    setCheckedIds(next);

    // Calculate new score
    let earned = 0;
    let max = 0;
    for (const s of scoringSettings) {
      max += s.max_points;
      if (next.has(s.id)) earned += s.max_points;
    }
    const normalized = max > 0 ? Math.round((earned / max) * 100) : 0;

    await updateLeadScore(lead.id, Array.from(next), normalized);
  }

  async function handleUpdate(field: string, value: string | number) {
    await updateLead(lead.id, { [field]: value });
  }

  async function handleDelete() {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    await deleteLead(lead.id);
    router.push("/leads");
  }

  async function handleAddActivity(formData: FormData) {
    formData.set("lead_id", lead.id);
    await addActivity(formData);
  }

  // Group scoring settings by category
  const groupedSettings = useMemo(() => {
    const groups: Record<string, ScoringSetting[]> = {
      firmographic: [],
      engagement: [],
      strategic: [],
    };
    for (const s of scoringSettings) {
      if (groups[s.category]) groups[s.category].push(s);
    }
    return groups;
  }, [scoringSettings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{lead.company_name}</h1>
          <p className="text-sm text-muted-foreground">{lead.contact_name}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Main info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>
                  {lead.country} — {lead.sector}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Forecast: {lead.forecast_month}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {formatCurrency(lead.expected_mrr)}/mo
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Badge variant={lead.source === "inbound" ? "default" : "secondary"}>
                  {lead.source}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick edit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update Deal</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Phase</Label>
                <Select
                  defaultValue={lead.phase}
                  onValueChange={(v) => handleUpdate("phase", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Discovery", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Probability (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={lead.probability}
                  onBlur={(e) => handleUpdate("probability", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected MRR ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  defaultValue={lead.expected_mrr}
                  onBlur={(e) => handleUpdate("expected_mrr", parseFloat(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Activity log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={handleAddActivity} className="mb-6 space-y-3">
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <Select name="type" defaultValue="note">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input name="notes" placeholder="Add a note..." required />
                </div>
                <Button type="submit" size="sm">
                  Add Activity
                </Button>
              </form>

              <Separator className="mb-4" />

              {activities.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activities yet
                </p>
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div
                      key={a.id}
                      className="flex gap-3 rounded-lg border bg-card/50 p-3"
                    >
                      <span className="text-lg">
                        {activityIcons[a.type] || "\u{1F4CC}"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {a.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(a.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{a.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Intelligence - Interactive Scoring */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Intelligence</CardTitle>
                <div className="flex items-center gap-2">
                  <span className={cn("text-2xl font-bold", scoreColor)}>
                    {totalScore}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <Progress value={totalScore} className={cn("h-2.5", progressColor)} />

              {(["firmographic", "engagement", "strategic"] as const).map((category) => {
                const items = groupedSettings[category];
                const catScore = categoryScores[category];
                if (items.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className={cn("text-sm font-semibold", categoryColors[category])}>
                        {categoryLabels[category]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {catScore.earned} / {catScore.max} pts
                      </span>
                    </div>
                    <div className="space-y-1">
                      {items.map((setting) => {
                        const isChecked = checkedIds.has(setting.id);
                        return (
                          <button
                            key={setting.id}
                            type="button"
                            onClick={() => toggleCriterion(setting.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                              isChecked
                                ? "border-primary/30 bg-primary/5"
                                : "border-transparent bg-muted/30 hover:bg-muted/50"
                            )}
                          >
                            {isChecked ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                            )}
                            <span className={cn("flex-1", isChecked && "text-foreground")}>
                              {setting.label}
                            </span>
                            <span className={cn(
                              "text-xs font-medium",
                              isChecked ? "text-primary" : "text-muted-foreground"
                            )}>
                              +{setting.max_points}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Raw points</span>
                <span className="font-medium">
                  {Object.values(categoryScores).reduce((s, c) => s + c.earned, 0)} / {maxScore}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Deal summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Deal Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phase</span>
                <Badge variant="outline">{lead.phase}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(lead.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Activity</span>
                <span>
                  {new Date(lead.last_activity_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weighted Value</span>
                <span className="font-semibold">
                  {formatCurrency(lead.expected_mrr * (lead.probability / 100))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
