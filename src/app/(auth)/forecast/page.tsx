import { getForecastData } from "@/services/kpi";
import { ForecastChart } from "@/components/forecast/forecast-chart";
import { ForecastTable } from "@/components/forecast/forecast-table";
import type { ForecastRow } from "@/types";

export default async function ForecastPage() {
  let forecastData: ForecastRow[];

  try {
    forecastData = await getForecastData();
  } catch {
    // Demo fallback
    forecastData = [
      { month: "2026-02", best: 45000, weighted: 28000, conservative: 15000 },
      { month: "2026-03", best: 62000, weighted: 38000, conservative: 22000 },
      { month: "2026-04", best: 55000, weighted: 32000, conservative: 18000 },
      { month: "2026-05", best: 78000, weighted: 45000, conservative: 28000 },
      { month: "2026-06", best: 42000, weighted: 25000, conservative: 12000 },
      { month: "2026-07", best: 35000, weighted: 18000, conservative: 8000 },
    ];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revenue Forecast</h1>
        <p className="text-sm text-muted-foreground">
          6-month revenue projections — best, weighted, and conservative cases
        </p>
      </div>

      <ForecastChart data={forecastData} />
      <ForecastTable data={forecastData} />
    </div>
  );
}
