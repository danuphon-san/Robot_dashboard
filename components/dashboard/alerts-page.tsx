"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AlertsPayload } from "@/lib/types";
import { fetchJson } from "@/components/dashboard/fetch-json";
import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { MachineLabel } from "@/components/dashboard/machine-visuals";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent, formatTimestamp, stateVariant } from "@/lib/utils";

export function AlertsPage({ search }: { search: string }) {
  const [data, setData] = useState<AlertsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const payload = await fetchJson<AlertsPayload>(`/api/alerts?${search}`);
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unknown error");
      }
    };
    load();
    const timer = window.setInterval(load, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [search]);

  return (
    <DashboardFrame
      title="Alert Priority"
      subtitle="Maintenance triage view sorted by criticality, warning state, and anomaly score."
      showMetric={false}
    >
      {error ? (
        <Card><CardContent className="p-8 text-rose-700">{error}</CardContent></Card>
      ) : !data ? (
        <Skeleton className="h-80 w-full" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card><CardContent className="p-6"><p className="text-sm text-slate-500">Critical Alerts</p><p className="mt-2 text-3xl font-semibold">{data.criticalCount}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-slate-500">Warning Alerts</p><p className="mt-2 text-3xl font-semibold">{data.warningCount}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-slate-500">Top 10 Machines</p><p className="mt-2 text-3xl font-semibold">{data.topTenMachines.length}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-slate-500">Priority Rows</p><p className="mt-2 text-3xl font-semibold">{data.priorityTable.length}</p></CardContent></Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Abnormal Axes Frequency</CardTitle>
                <CardDescription>How often each axis appears in `top_axes`.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topAxisFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Abnormal Features Frequency</CardTitle>
                <CardDescription>Most frequent features from `top_features`.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topFeatureFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alert Priority Table</CardTitle>
              <CardDescription>Sorted by critical state, warning state, then highest score.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="py-3 pr-4">Priority</th>
                      <th className="py-3 pr-4">Machine</th>
                      <th className="py-3 pr-4">Timestamp</th>
                      <th className="py-3 pr-4">Score</th>
                      <th className="py-3 pr-4">Warn</th>
                      <th className="py-3 pr-4">Critical</th>
                      <th className="py-3 pr-4">State</th>
                      <th className="py-3 pr-4">Top Axes</th>
                      <th className="py-3 pr-4">Top Features</th>
                      <th className="py-3">Suggested Inspection Focus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.priorityTable.map((row) => (
                      <tr key={`${row.machineId}-${row.timestamp}`} className="border-b align-top">
                        <td className="py-4 pr-4 font-semibold">{row.priority}</td>
                        <td className="py-4 pr-4">
                          <MachineLabel hotCode={row.hotCode} machineId={row.machineId} compact />
                        </td>
                        <td className="py-4 pr-4 text-slate-600">{formatTimestamp(row.timestamp)}</td>
                        <td className="py-4 pr-4">{row.score != null ? formatPercent(row.score) : "N/A"}</td>
                        <td className="py-4 pr-4">{row.thresholdWarn != null ? formatPercent(row.thresholdWarn) : "N/A"}</td>
                        <td className="py-4 pr-4">{row.thresholdCrit != null ? formatPercent(row.thresholdCrit) : "N/A"}</td>
                        <td className="py-4 pr-4"><Badge variant={stateVariant(row.state)}>{row.state ?? "normal"}</Badge></td>
                        <td className="py-4 pr-4">{row.topAxes.join(", ") || "N/A"}</td>
                        <td className="py-4 pr-4">{row.topFeatures.join(", ") || "N/A"}</td>
                        <td className="py-4 text-slate-700">{row.suggestedInspectionFocus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardFrame>
  );
}
