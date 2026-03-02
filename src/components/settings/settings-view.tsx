"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";
import { updatePhaseSetting, updateScoringSetting } from "@/actions/settings";
import { ScheduleSettings } from "@/components/settings/schedule-settings";
import type { PhaseSetting, ScoringSetting } from "@/types";

interface SettingsViewProps {
  phases: PhaseSetting[];
  scoring: ScoringSetting[];
  workDays: number[];
}

export function SettingsView({ phases, scoring, workDays }: SettingsViewProps) {
  return (
    <Tabs defaultValue="phases">
      <TabsList>
        <TabsTrigger value="phases">Pipeline Phases</TabsTrigger>
        <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
      </TabsList>

      <TabsContent value="phases" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline Phases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {phases.map((phase) => (
                <PhaseRow key={phase.id} phase={phase} />
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="scoring" className="space-y-4 mt-4">
        {(["firmographic", "engagement", "strategic"] as const).map(
          (category) => {
            const items = scoring.filter((s) => s.category === category);
            const maxTotal = items.reduce((s, i) => s + i.max_points, 0);
            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base capitalize">
                      {category} Criteria
                    </CardTitle>
                    <Badge variant="outline">{maxTotal} pts max</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <ScoringRow key={item.id} setting={item} />
                    ))}
                    {items.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No criteria configured
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          }
        )}
      </TabsContent>

      <TabsContent value="schedule" className="space-y-4 mt-4">
        <ScheduleSettings workDays={workDays} />
      </TabsContent>
    </Tabs>
  );
}

function PhaseRow({ phase }: { phase: PhaseSetting }) {
  const [targetDays, setTargetDays] = useState(phase.target_days);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updatePhaseSetting(phase.id, { target_days: targetDays });
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <div
        className="h-4 w-4 rounded-full shrink-0"
        style={{ backgroundColor: phase.color }}
      />
      <div className="flex-1 min-w-0">
        <span className="font-medium">{phase.name}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          Order: {phase.order}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">
          Target days:
        </Label>
        <Input
          type="number"
          min="0"
          value={targetDays}
          onChange={(e) => setTargetDays(parseInt(e.target.value) || 0)}
          className="w-20"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ScoringRow({ setting }: { setting: ScoringSetting }) {
  const [maxPoints, setMaxPoints] = useState(setting.max_points);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateScoringSetting(setting.id, { max_points: maxPoints });
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{setting.label}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          ({setting.key})
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">
          Max pts:
        </Label>
        <Input
          type="number"
          min="0"
          max="100"
          value={maxPoints}
          onChange={(e) => setMaxPoints(parseInt(e.target.value) || 0)}
          className="w-20"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
