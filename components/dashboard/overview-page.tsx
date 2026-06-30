"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AlertTriangle, Cpu, PauseCircle, PlayCircle, ShieldAlert } from "lucide-react";
import type { OverviewPayload } from "@/lib/types";
import { fetchJson } from "@/components/dashboard/fetch-json";
import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { MachineLabel } from "@/components/dashboard/machine-visuals";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatPercent,
  formatTimestamp,
  stateLabel,
  stateVariant
} from "@/lib/utils";

function Stat({
  title,
  value,
  icon: Icon
}: {
  title: string;
  value: string;
  icon: typeof Cpu;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewPage({ search }: { search: string }) {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const payload = await fetchJson<OverviewPayload>(`/api/overview?${search}`);
        if (!cancelled) setData(payload);
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
      title="Machine Health Overview"
      subtitle="Current health status across the manufacturing line with live anomaly context and machine operating state."
    >
      {error ? (
        <Card><CardContent className="p-8 text-rose-700">{error}</CardContent></Card>
      ) : !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Stat title="Total Machines" value={String(data.kpis.totalMachines)} icon={Cpu} />
            <Stat title="Running" value={String(data.kpis.runningMachines)} icon={PlayCircle} />
            <Stat title="Stopped" value={String(data.kpis.stoppedMachines)} icon={PauseCircle} />
            <Stat title="Warning" value={String(data.kpis.warningMachines)} icon={AlertTriangle} />
            <Stat title="Critical" value={String(data.kpis.criticalMachines)} icon={ShieldAlert} />
            <Stat title="Avg Score" value={formatPercent(data.kpis.averageAnomalyScore)} icon={Cpu} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Machine Status Tile Map</CardTitle>
                <CardDescription>
                  Latest condition per machine. Updated {formatTimestamp(data.latestUpdatedAt)}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {data.tiles.map((tile) => (
                    <Link
                      key={tile.machineId}
                      href={`/machines/${tile.machineId}?machineId=${tile.machineId}&from=${encodeURIComponent(data.filters.from)}&to=${encodeURIComponent(data.filters.to)}&metric=${data.filters.metric}`}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <MachineLabel
                          hotCode={tile.hotCode}
                          machineId={tile.machineId}
                          compact
                        />
                        <Badge variant={stateVariant(tile.state)}>
                          {stateLabel(tile.state, tile.execState)}
                        </Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500">Score</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {tile.score != null ? formatPercent(tile.score) : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Power</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {tile.motorPowerState ?? "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Mode</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {tile.operatingMode ?? "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Updated</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {new Date(tile.ts).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Current machine distribution by anomaly state.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.statusDistribution.every((entry) => entry.value === 0) ? (
                  <div className="flex h-[340px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-500">
                    No status distribution data for the selected filters.
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[1fr,220px]">
                    <div className="h-[340px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.statusDistribution}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={3}
                          >
                            {data.statusDistribution.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                      {data.statusDistribution.map((entry) => {
                        const percent =
                          data.kpis.totalMachines > 0
                            ? (entry.value / data.kpis.totalMachines) * 100
                            : 0;
                        return (
                          <div
                            key={entry.name}
                            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <p className="font-semibold text-slate-900">{entry.name}</p>
                            </div>
                            <div className="mt-2 flex items-end justify-between">
                              <p className="text-2xl font-semibold text-slate-950">
                                {entry.value}
                              </p>
                              <p className="text-sm text-slate-500">{percent.toFixed(1)}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Score Trend</CardTitle>
                <CardDescription>Average anomaly score over the selected time range.</CardDescription>
              </CardHeader>
              <CardContent className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.anomalyTrend}>
                    <XAxis dataKey="ts" hide />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="averageScore" stroke="#2563eb" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Risk Machines</CardTitle>
                <CardDescription>Highest current anomaly scores first.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.topRiskMachines.map((row) => (
                  <Link
                    key={row.machineId}
                    href={`/machines/${row.machineId}?machineId=${row.machineId}&from=${encodeURIComponent(data.filters.from)}&to=${encodeURIComponent(data.filters.to)}&metric=${data.filters.metric}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:bg-white"
                  >
                    <MachineLabel
                      hotCode={row.hotCode}
                      machineId={row.machineId}
                      subtitle={row.execProgram ?? "No program"}
                      compact
                    />
                    <div className="text-right">
                      <Badge variant={stateVariant(row.state)}>{row.state ?? "normal"}</Badge>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {row.score != null ? formatPercent(row.score) : "N/A"}
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardFrame>
  );
}
