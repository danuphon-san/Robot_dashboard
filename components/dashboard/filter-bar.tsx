"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AXIS_METRICS, type AxisMetric } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

export function FilterBar({
  showMetric = true,
  machineIdLocked = false
}: {
  showMetric?: boolean;
  machineIdLocked?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaults = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      machineId: searchParams.get("machineId") ?? "",
      state: searchParams.get("state") ?? "all",
      metric: (searchParams.get("metric") ?? "joint_dev") as AxisMetric,
      from: searchParams.get("from") ?? from.toISOString(),
      to: searchParams.get("to") ?? now.toISOString()
    };
  }, [searchParams]);

  const [machineId, setMachineId] = useState(defaults.machineId);
  const [state, setState] = useState(defaults.state);
  const [metric, setMetric] = useState<AxisMetric>(defaults.metric);
  const [from, setFrom] = useState(toLocalInput(defaults.from));
  const [to, setTo] = useState(toLocalInput(defaults.to));

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (!machineIdLocked) {
      if (machineId) params.set("machineId", machineId);
      else params.delete("machineId");
    }
    if (state && state !== "all") params.set("state", state);
    else params.delete("state");
    if (showMetric && metric) params.set("metric", metric);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    router.push(`${pathname}?${params.toString()}` as never);
  };

  return (
    <Card className="p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          value={machineId}
          onChange={(event) => setMachineId(event.target.value)}
          disabled={machineIdLocked}
          placeholder="Machine ID"
          className="rounded-2xl border bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-slate-300"
        />
        <select
          value={state}
          onChange={(event) => setState(event.target.value)}
          className="rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
        >
          <option value="all">All states</option>
          <option value="normal">Normal</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        {showMetric ? (
          <select
            value={metric}
            onChange={(event) => setMetric(event.target.value as AxisMetric)}
            className="rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
          >
            {AXIS_METRICS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : (
          <div className="hidden xl:block" />
        )}
        <input
          type="datetime-local"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className="rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
        />
        <div className="flex gap-3">
          <input
            type="datetime-local"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="min-w-0 flex-1 rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
          />
          <Button onClick={applyFilters}>Apply</Button>
        </div>
      </div>
    </Card>
  );
}
