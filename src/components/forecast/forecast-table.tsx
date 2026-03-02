"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ForecastRow } from "@/types";

function formatMonth(m: string) {
  const [year, month] = m.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export function ForecastTable({ data }: { data: ForecastRow[] }) {
  const totals = data.reduce(
    (acc, row) => ({
      best: acc.best + row.best,
      weighted: acc.weighted + row.weighted,
      conservative: acc.conservative + row.conservative,
    }),
    { best: 0, weighted: 0, conservative: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Forecast Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-3 pr-4 text-left font-medium">Month</th>
                <th className="py-3 px-4 text-right font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-50" />
                    Best Case
                  </span>
                </th>
                <th className="py-3 px-4 text-right font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Weighted
                  </span>
                </th>
                <th className="py-3 pl-4 text-right font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Conservative
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.month} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    {formatMonth(row.month)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400">
                    {formatCurrency(row.best)}
                  </td>
                  <td className="py-3 px-4 text-right text-blue-400 font-semibold">
                    {formatCurrency(row.weighted)}
                  </td>
                  <td className="py-3 pl-4 text-right text-amber-400">
                    {formatCurrency(row.conservative)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className="py-3 pr-4">Total</td>
                <td className="py-3 px-4 text-right text-emerald-400">
                  {formatCurrency(totals.best)}
                </td>
                <td className="py-3 px-4 text-right text-blue-400">
                  {formatCurrency(totals.weighted)}
                </td>
                <td className="py-3 pl-4 text-right text-amber-400">
                  {formatCurrency(totals.conservative)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
