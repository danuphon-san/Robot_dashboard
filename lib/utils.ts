import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  AxisMetric,
  AxisValue,
  DashboardFilters,
  FilterState,
  FrequencyPoint
} from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatTimestamp(value: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function toAxisValues(raw: unknown): AxisValue[] {
  const array = Array.isArray(raw) ? raw : [];
  return Array.from({ length: 7 }, (_, index) => ({
    axis: `J${index + 1}`,
    value: typeof array[index] === "number" ? array[index] : array[index] != null ? Number(array[index]) : null
  }));
}

function flattenNames(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => flattenNames(item));
  }
  if (typeof raw === "string") return [raw];
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>).flatMap(([key, value]) => {
      if (typeof value === "number" && value > 0) return [key];
      if (typeof value === "string") return [value];
      if (Array.isArray(value) || typeof value === "object") return [key, ...flattenNames(value)];
      return [key];
    });
  }
  return [];
}

function extractScoredList(raw: unknown) {
  if (!raw) return [] as Array<{ name: string; score: number | null }>;
  if (Array.isArray(raw)) {
    return flattenNames(raw).map((name) => ({ name, score: null }));
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>).map(([name, value]) => ({
      name,
      score: typeof value === "number" ? value : null
    }));
  }
  return [];
}

export function parseTopAxes(raw: unknown) {
  return extractScoredList(raw)
    .filter((item) => /^J[1-7]$/i.test(item.name))
    .map((item) => ({ ...item, name: item.name.toUpperCase() }));
}

export function parseTopFeatures(raw: unknown) {
  return extractScoredList(raw);
}

export function summarizeInspectionFocus(topAxes: string[], topFeatures: string[]) {
  const suggestions = new Set<string>();
  if (topAxes.length > 0) suggestions.add(`Check ${topAxes.join(", ")}`);
  if (topFeatures.some((feature) => feature.includes("joint_dev"))) {
    suggestions.add("Check joint deviation");
  }
  if (topFeatures.some((feature) => feature.includes("motor_current"))) {
    suggestions.add("Check motor current/load");
  }
  if (topFeatures.some((feature) => feature.includes("joint_speed"))) {
    suggestions.add("Check joint speed behavior");
  }
  return Array.from(suggestions).join(" • ") || "Inspect latest state and anomaly context";
}

export function countFrequency(items: string[], allowed?: RegExp) {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (allowed && !allowed.test(item)) continue;
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count) as FrequencyPoint[];
}

export function normalizeFilters(searchParams: URLSearchParams): Required<DashboardFilters> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const state = (searchParams.get("state") as FilterState | null) ?? "all";
  const metric = (searchParams.get("metric") as AxisMetric | null) ?? "joint_dev";
  return {
    machineId: searchParams.get("machineId") ?? "",
    state,
    metric,
    from: searchParams.get("from") ?? yesterday.toISOString(),
    to: searchParams.get("to") ?? now.toISOString()
  };
}

export function stateVariant(state: string | null) {
  if (state === "critical") return "danger";
  if (state === "warning") return "warning";
  if (state === "normal") return "success";
  return "neutral";
}

export function stateLabel(state: string | null, execState: number | null) {
  if (state && state !== "normal") return state;
  if (execState === 0) return "stopped";
  return state ?? "normal";
}

export function machineDisplayName(hotCode: string | null, machineId: string) {
  return hotCode && hotCode.trim().length > 0 ? hotCode : machineId;
}
