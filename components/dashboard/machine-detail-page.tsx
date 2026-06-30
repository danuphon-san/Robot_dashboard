"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AxisMetric, MachineDetailPayload, MetricTrendPoint } from "@/lib/types";
import { fetchJson } from "@/components/dashboard/fetch-json";
import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { MachineLabel, parameterIcons } from "@/components/dashboard/machine-visuals";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent, formatTimestamp, stateVariant } from "@/lib/utils";

type DetailField = {
  label: string;
  value: string | number;
  icon: LucideIcon;
};

export function MachineDetailPage({
  machineId,
  search
}: {
  machineId: string;
  search: string;
}) {
  const [detail, setDetail] = useState<MachineDetailPayload | null>(null);
  const [trend, setTrend] = useState<MetricTrendPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const metric = useMemo(() => new URLSearchParams(search).get("metric") ?? "joint_dev", [search]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [detailPayload, trendPayload] = await Promise.all([
          fetchJson<MachineDetailPayload>(`/api/machines/${machineId}?${search}`),
          fetchJson<MetricTrendPoint[]>(`/api/machines/${machineId}/trend?${search}`)
        ]);
        if (!cancelled) {
          setDetail(detailPayload);
          setTrend(trendPayload);
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
  }, [machineId, search]);

  const trendRows = trend.map((point) => ({
    ts: point.ts,
    ...Object.fromEntries(point.values.map((entry) => [entry.axis, entry.value]))
  }));

  const infoFields: DetailField[] = detail
    ? [
        { label: "Machine ID", value: detail.latest.machineId, icon: parameterIcons.machine },
        { label: "Latest Timestamp", value: formatTimestamp(detail.latest.ts), icon: parameterIcons.timestamp },
        { label: "Hot Code", value: detail.latest.hotCode ?? "N/A", icon: parameterIcons.hotCode },
        { label: "Execution Program", value: detail.latest.execProgram ?? "N/A", icon: parameterIcons.program },
        { label: "Execution Step", value: detail.latest.execStep ?? "N/A", icon: parameterIcons.step },
        { label: "Execution State", value: detail.latest.execState ?? "N/A", icon: parameterIcons.state },
        { label: "Operating Mode", value: detail.latest.operatingMode ?? "N/A", icon: parameterIcons.mode },
        { label: "Motor Power", value: detail.latest.motorPowerState ?? "N/A", icon: parameterIcons.power },
        { label: "Anomaly Score", value: detail.latest.score != null ? formatPercent(detail.latest.score) : "N/A", icon: parameterIcons.score },
        { label: "Warn Threshold", value: detail.latest.thresholdWarn != null ? formatPercent(detail.latest.thresholdWarn) : "N/A", icon: parameterIcons.warning },
        { label: "Critical Threshold", value: detail.latest.thresholdCrit != null ? formatPercent(detail.latest.thresholdCrit) : "N/A", icon: parameterIcons.critical }
      ]
    : [];

  return (
    <DashboardFrame
      title={`Machine Detail: ${detail ? detail.latest.hotCode ?? machineId : machineId}`}
      subtitle="Latest machine condition, 7-axis metrics, anomaly trend, and inspection clues from the anomaly model output."
      machineIdLocked
    >
      {error ? (
        <Card><CardContent className="p-8 text-rose-700">{error}</CardContent></Card>
      ) : !detail ? (
        <Skeleton className="h-80 w-full" />
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <MachineLabel
                hotCode={detail.latest.hotCode}
                machineId={detail.latest.machineId}
                subtitle={detail.latest.execProgram ?? detail.latest.topic ?? "Machine context"}
              />
              <div className="flex items-center gap-3">
                <Badge variant={stateVariant(detail.latest.state)}>{detail.latest.state ?? "normal"}</Badge>
                <p className="text-sm text-slate-500">{formatTimestamp(detail.latest.ts)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {infoFields.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Icon className="h-4 w-4" />
                    <p>{label}</p>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{String(value)}</p>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Current Anomaly State</p>
                <div className="mt-2">
                  <Badge variant={stateVariant(detail.latest.state)}>{detail.latest.state ?? "normal"}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {Object.entries(detail.axes).map(([name, values]) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle>{name}</CardTitle>
                  <CardDescription>Latest J1–J7 values.</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={values}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="axis" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Score Over Time</CardTitle>
                <CardDescription>Score with warning and critical thresholds.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detail.anomalyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ts" hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="score" stroke="#2563eb" dot={false} strokeWidth={3} />
                    <Line dataKey="thresholdWarn" stroke="#f59e0b" dot={false} />
                    <Line dataKey="thresholdCrit" stroke="#ef4444" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{metric} Over Time</CardTitle>
                <CardDescription>Selected axis metric trend for J1–J7.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendRows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ts" hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {["J1", "J2", "J3", "J4", "J5", "J6", "J7"].map((axis, index) => (
                      <Line
                        key={axis}
                        dataKey={axis}
                        dot={false}
                        stroke={["#1d4ed8", "#2563eb", "#0f766e", "#16a34a", "#d97706", "#dc2626", "#7c3aed"][index]}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Abnormal Axes</CardTitle>
                <CardDescription>Derived from `top_axes`.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detail.topAxes.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                      <span className="font-semibold text-slate-950">{item.name}</span>
                      <span className="text-sm text-slate-600">{item.score != null ? item.score.toFixed(3) : "N/A"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Abnormal Features</CardTitle>
                <CardDescription>Derived from `top_features`.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detail.topFeatures.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                      <span className="font-semibold text-slate-950">{item.name}</span>
                      <span className="text-sm text-slate-600">{item.score != null ? item.score.toFixed(3) : "N/A"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardFrame>
  );
}
