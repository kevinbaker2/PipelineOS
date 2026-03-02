"use client";

import { DollarSign, TrendingUp, Calendar, Percent, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { KPIData } from "@/types";

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

function KPICard({ title, value, icon: Icon, trend, color }: KPICardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {trend && (
              <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              color
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KPICards({ data }: { data: KPIData }) {
  const cards: KPICardProps[] = [
    {
      title: "Active MRR",
      value: formatCurrency(data.activeMRR),
      icon: DollarSign,
      trend: "From closed-won deals",
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Weighted Pipeline",
      value: formatCurrency(data.weightedPipeline),
      icon: TrendingUp,
      trend: "Probability-adjusted value",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "3-Month Forecast",
      value: formatCurrency(data.forecast3Month),
      icon: Calendar,
      trend: "Next 3 months weighted",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "Close Rate",
      value: formatPercent(data.closeRate),
      icon: Percent,
      trend: "Won / (Won + Lost)",
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      title: "Avg Sales Cycle",
      value: `${data.avgSalesCycle}d`,
      icon: Clock,
      trend: "Days to close",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      title: "Health Score",
      value: `${data.healthScore}/100`,
      icon: Shield,
      trend: data.healthScore >= 70 ? "Healthy" : data.healthScore >= 40 ? "Needs attention" : "At risk",
      color:
        data.healthScore >= 70
          ? "bg-emerald-500/10 text-emerald-500"
          : data.healthScore >= 40
          ? "bg-amber-500/10 text-amber-500"
          : "bg-red-500/10 text-red-500",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <KPICard key={card.title} {...card} />
      ))}
    </div>
  );
}
