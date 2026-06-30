export const AXIS_METRICS = [
  "joint_angle",
  "joint_cmd",
  "joint_dev",
  "joint_speed",
  "motor_current",
  "motor_current_cmd"
] as const;

export type AxisMetric = (typeof AXIS_METRICS)[number];

export type FilterState = "all" | "normal" | "warning" | "critical";

export type DashboardFilters = {
  machineId?: string;
  state?: FilterState;
  from?: string;
  to?: string;
  metric?: AxisMetric;
};

export type KpiSummary = {
  totalMachines: number;
  runningMachines: number;
  stoppedMachines: number;
  warningMachines: number;
  criticalMachines: number;
  averageAnomalyScore: number;
};

export type OverviewMachineTile = {
  machineId: string;
  hotCode: string | null;
  topic: string | null;
  ts: string;
  execState: number | null;
  operatingMode: number | null;
  motorPowerState: number | null;
  score: number | null;
  thresholdWarn: number | null;
  thresholdCrit: number | null;
  state: string | null;
};

export type RiskMachineRow = OverviewMachineTile & {
  hotCode: string | null;
  execProgram: string | null;
};

export type TrendPoint = {
  ts: string;
  averageScore: number;
};

export type DistributionPoint = {
  name: string;
  value: number;
  color: string;
};

export type OverviewPayload = {
  filters: Required<Pick<DashboardFilters, "state" | "metric">> & {
    machineId: string;
    from: string;
    to: string;
  };
  kpis: KpiSummary;
  tiles: OverviewMachineTile[];
  topRiskMachines: RiskMachineRow[];
  anomalyTrend: TrendPoint[];
  statusDistribution: DistributionPoint[];
  latestUpdatedAt: string | null;
};

export type AxisValue = {
  axis: string;
  value: number | null;
};

export type MachineDetailPayload = {
  latest: {
    machineId: string;
    ts: string;
    hotCode: string | null;
    topic: string | null;
    execProgram: string | null;
    execStep: number | null;
    execState: number | null;
    operatingMode: number | null;
    motorPowerState: number | null;
    score: number | null;
    thresholdWarn: number | null;
    thresholdCrit: number | null;
    state: string | null;
  };
  axes: Record<AxisMetric, AxisValue[]>;
  anomalyTrend: Array<{
    ts: string;
    score: number | null;
    thresholdWarn: number | null;
    thresholdCrit: number | null;
  }>;
  topAxes: Array<{
    name: string;
    score: number | null;
  }>;
  topFeatures: Array<{
    name: string;
    score: number | null;
  }>;
};

export type MetricTrendPoint = {
  ts: string;
  values: AxisValue[];
};

export type MachineListItem = {
  machineId: string;
  latestTs: string;
  hotCode: string | null;
  topic: string | null;
  execProgram: string | null;
  execState: number | null;
  operatingMode: number | null;
  motorPowerState: number | null;
  score: number | null;
  thresholdWarn: number | null;
  thresholdCrit: number | null;
  state: string | null;
};

export type AlertRow = {
  priority: number;
  machineId: string;
  hotCode: string | null;
  timestamp: string;
  score: number | null;
  thresholdWarn: number | null;
  thresholdCrit: number | null;
  state: string | null;
  topAxes: string[];
  topFeatures: string[];
  suggestedInspectionFocus: string;
};

export type FrequencyPoint = {
  name: string;
  count: number;
};

export type AlertsPayload = {
  criticalCount: number;
  warningCount: number;
  topTenMachines: AlertRow[];
  priorityTable: AlertRow[];
  topAxisFrequency: FrequencyPoint[];
  topFeatureFrequency: FrequencyPoint[];
};
