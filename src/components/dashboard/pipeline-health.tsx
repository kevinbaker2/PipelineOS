"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PipelineHealthBreakdown } from "@/types";

const healthMetrics = [
  { key: "velocityScore" as const, label: "Deal Velocity", max: 25 },
  { key: "conversionScore" as const, label: "Conversion Rate", max: 25 },
  { key: "coverageScore" as const, label: "Pipeline Coverage", max: 25 },
  { key: "activityScore" as const, label: "Lead Quality", max: 25 },
];

export function PipelineHealth({ data }: { data: PipelineHealthBreakdown }) {
  const scoreColor =
    data.score >= 70
      ? "text-emerald-400"
      : data.score >= 40
      ? "text-amber-400"
      : "text-red-400";

  const progressColor =
    data.score >= 70
      ? "[&>div]:bg-emerald-500"
      : data.score >= 40
      ? "[&>div]:bg-amber-500"
      : "[&>div]:bg-red-500";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pipeline Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={cn("text-4xl font-bold", scoreColor)}>
            {data.score}
          </div>
          <div className="flex-1">
            <Progress value={data.score} className={cn("h-2.5", progressColor)} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{data.explanation}</p>

        <div className="space-y-3">
          {healthMetrics.map((metric) => {
            const value = data[metric.key];
            const pct = (value / metric.max) * 100;
            return (
              <div key={metric.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-medium">
                    {value}/{metric.max}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
