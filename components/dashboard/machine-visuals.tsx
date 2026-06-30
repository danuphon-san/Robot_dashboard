import { Bot, CircuitBoard, Gauge, RadioTower, ShieldAlert, TimerReset, Workflow, Wrench } from "lucide-react";
import { cn, machineDisplayName } from "@/lib/utils";

export function ManipulatorRobotIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-10 w-10", className)}
      fill="none"
      aria-hidden="true"
    >
      <rect x="8" y="50" width="22" height="6" rx="3" fill="currentColor" opacity="0.18" />
      <rect x="12" y="44" width="8" height="8" rx="2" fill="currentColor" opacity="0.3" />
      <path d="M18 44V30l12-7 8 6-8 10 8 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30" cy="23" r="4" fill="currentColor" />
      <circle cx="38" cy="29" r="4" fill="currentColor" opacity="0.8" />
      <circle cx="30" cy="39" r="4" fill="currentColor" opacity="0.7" />
      <path d="M46 46h8m-4-4v8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function MachineLabel({
  hotCode,
  machineId,
  subtitle,
  compact = false
}: {
  hotCode: string | null;
  machineId: string;
  subtitle?: string | null;
  compact?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn("rounded-2xl bg-slate-900/5 p-2.5 text-slate-700", compact && "p-2")}>
        <ManipulatorRobotIcon className={compact ? "h-7 w-7" : "h-8 w-8"} />
      </div>
      <div className="min-w-0">
        <p className={cn("truncate font-semibold text-slate-950", compact ? "text-base" : "text-lg")}>
          {machineDisplayName(hotCode, machineId)}
        </p>
        <p className="truncate text-xs text-slate-500">{machineId}</p>
        {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export const parameterIcons = {
  machine: Bot,
  timestamp: TimerReset,
  hotCode: CircuitBoard,
  program: Workflow,
  step: Wrench,
  state: RadioTower,
  mode: Gauge,
  power: ShieldAlert,
  score: Gauge,
  warning: ShieldAlert,
  critical: ShieldAlert
};
