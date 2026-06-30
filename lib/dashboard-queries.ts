import { pool } from "@/lib/db";
import type {
  AlertsPayload,
  AxisMetric,
  DashboardFilters,
  MachineDetailPayload,
  MachineListItem,
  MetricTrendPoint,
  OverviewPayload
} from "@/lib/types";
import {
  countFrequency,
  normalizeFilters,
  parseTopAxes,
  parseTopFeatures,
  summarizeInspectionFocus,
  toAxisValues
} from "@/lib/utils";

type DbRow = Record<string, unknown>;

function toNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function buildBaseParams(filters: Required<DashboardFilters>) {
  return [filters.from, filters.to, filters.machineId ? `%${filters.machineId}%` : null, filters.state];
}

async function getLatestJoinedRows(filters: Required<DashboardFilters>) {
  const params = buildBaseParams(filters);
  const { rows } = await pool.query<DbRow>(
    `
      WITH latest_state AS (
        SELECT DISTINCT ON (ms.machine_id)
          ms.machine_id,
          ms.topic,
          ms.ts,
          ms.hot_code,
          ms.exec_program,
          ms.exec_step,
          ms.exec_state,
          ms.operating_mode,
          ms.motor_power_state,
          ms.joint_angle,
          ms.joint_cmd,
          ms.joint_dev,
          ms.joint_speed,
          ms.motor_current,
          ms.motor_current_cmd
        FROM machine_state ms
        WHERE ms.ts BETWEEN $1::timestamptz AND $2::timestamptz
          AND ($3::text IS NULL OR ms.machine_id ILIKE $3)
        ORDER BY ms.machine_id, ms.ts DESC
      ),
      latest_anomaly AS (
        SELECT DISTINCT ON (mas.machine_id)
          mas.machine_id,
          mas.ts_bucket,
          mas.score,
          mas.threshold_warn,
          mas.threshold_crit,
          mas.state,
          mas.top_axes,
          mas.top_features
        FROM machine_anomaly_scores mas
        WHERE mas.ts_bucket BETWEEN $1::timestamptz AND $2::timestamptz
          AND ($3::text IS NULL OR mas.machine_id ILIKE $3)
        ORDER BY mas.machine_id, mas.ts_bucket DESC
      )
      SELECT
        ls.machine_id,
        ls.topic,
        ls.ts,
        ls.hot_code,
        ls.exec_program,
        ls.exec_step,
        ls.exec_state,
        ls.operating_mode,
        ls.motor_power_state,
        ls.joint_angle,
        ls.joint_cmd,
        ls.joint_dev,
        ls.joint_speed,
        ls.motor_current,
        ls.motor_current_cmd,
        la.ts_bucket,
        la.score,
        la.threshold_warn,
        la.threshold_crit,
        la.state,
        la.top_axes,
        la.top_features
      FROM latest_state ls
      LEFT JOIN latest_anomaly la ON la.machine_id = ls.machine_id
      WHERE 1=1
        AND ($4::text = 'all' OR COALESCE(la.state, 'normal') = $4)
      ORDER BY
        CASE COALESCE(la.state, 'normal')
          WHEN 'critical' THEN 0
          WHEN 'warning' THEN 1
          WHEN 'normal' THEN 2
          ELSE 3
        END,
        COALESCE(la.score, 0) DESC,
        ls.ts DESC
    `,
    params
  );
  return rows;
}

function bucketMinutes(from: string, to: string) {
  const hours = (new Date(to).getTime() - new Date(from).getTime()) / 36e5;
  if (hours <= 6) return 1;
  if (hours <= 24) return 5;
  if (hours <= 72) return 15;
  return 30;
}

export async function getOverview(filters: Required<DashboardFilters>): Promise<OverviewPayload> {
  const joinedRows = await getLatestJoinedRows(filters);
  const params = buildBaseParams(filters);
  const { rows: trendRows } = await pool.query<DbRow>(
    `
      SELECT
        date_bin(make_interval(mins => $4), ts_bucket, TIMESTAMPTZ '2000-01-01 00:00:00+00') AS ts,
        AVG(score) AS average_score
      FROM machine_anomaly_scores
      WHERE ts_bucket BETWEEN $1::timestamptz AND $2::timestamptz
        AND ($3::text IS NULL OR machine_id ILIKE $3)
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    [filters.from, filters.to, filters.machineId ? `%${filters.machineId}%` : null, bucketMinutes(filters.from, filters.to)]
  );

  const normalized = joinedRows.map((row) => ({
    machineId: String(row.machine_id),
    topic: (row.topic as string | null) ?? null,
    ts: String(row.ts),
    hotCode: (row.hot_code as string | null) ?? null,
    execProgram: (row.exec_program as string | null) ?? null,
    execState: toNumber(row.exec_state),
    operatingMode: toNumber(row.operating_mode),
    motorPowerState: toNumber(row.motor_power_state),
    score: toNumber(row.score),
    thresholdWarn: toNumber(row.threshold_warn),
    thresholdCrit: toNumber(row.threshold_crit),
    state: (row.state as string | null) ?? "normal"
  }));

  const classifiedStates = normalized.map((row) => {
    if (row.execState === 0) return "stopped";
    if (row.state === "critical") return "critical";
    if (row.state === "warning") return "warning";
    return "normal";
  });

  const statusCounts = {
    normal: classifiedStates.filter((state) => state === "normal").length,
    warning: classifiedStates.filter((state) => state === "warning").length,
    critical: classifiedStates.filter((state) => state === "critical").length,
    stopped: classifiedStates.filter((state) => state === "stopped").length
  };

  const kpis = {
    totalMachines: normalized.length,
    runningMachines: normalized.filter((row) => row.execState !== 0).length,
    stoppedMachines: statusCounts.stopped,
    warningMachines: statusCounts.warning,
    criticalMachines: statusCounts.critical,
    averageAnomalyScore:
      normalized.reduce((sum, row) => sum + (row.score ?? 0), 0) / Math.max(normalized.length, 1)
  };

  return {
    filters,
    kpis,
    tiles: normalized.map((row) => ({
      machineId: row.machineId,
      hotCode: row.hotCode,
      topic: row.topic,
      ts: row.ts,
      execState: row.execState,
      operatingMode: row.operatingMode,
      motorPowerState: row.motorPowerState,
      score: row.score,
      thresholdWarn: row.thresholdWarn,
      thresholdCrit: row.thresholdCrit,
      state: row.state
    })),
    topRiskMachines: normalized.slice(0, 10).map((row) => ({
      ...row
    })),
    anomalyTrend: trendRows.map((row) => ({
      ts: String(row.ts),
      averageScore: Number(row.average_score ?? 0)
    })),
    statusDistribution: [
      { name: "Normal", value: statusCounts.normal, color: "#10b981" },
      { name: "Warning", value: statusCounts.warning, color: "#f59e0b" },
      { name: "Critical", value: statusCounts.critical, color: "#ef4444" },
      { name: "Stopped", value: statusCounts.stopped, color: "#94a3b8" }
    ],
    latestUpdatedAt: normalized[0]?.ts ?? null
  };
}

export async function getMachines(filters: Required<DashboardFilters>): Promise<MachineListItem[]> {
  const rows = await getLatestJoinedRows(filters);
  return rows.map((row) => ({
    machineId: String(row.machine_id),
    latestTs: String(row.ts),
    hotCode: (row.hot_code as string | null) ?? null,
    topic: (row.topic as string | null) ?? null,
    execProgram: (row.exec_program as string | null) ?? null,
    execState: toNumber(row.exec_state),
    operatingMode: toNumber(row.operating_mode),
    motorPowerState: toNumber(row.motor_power_state),
    score: toNumber(row.score),
    thresholdWarn: toNumber(row.threshold_warn),
    thresholdCrit: toNumber(row.threshold_crit),
    state: (row.state as string | null) ?? "normal"
  }));
}

export async function getMachineDetail(machineId: string, filters: Required<DashboardFilters>): Promise<MachineDetailPayload | null> {
  const { rows } = await pool.query<DbRow>(
    `
      WITH latest_state AS (
        SELECT *
        FROM machine_state
        WHERE machine_id = $1
          AND ts BETWEEN $2::timestamptz AND $3::timestamptz
        ORDER BY ts DESC
        LIMIT 1
      ),
      latest_anomaly AS (
        SELECT *
        FROM machine_anomaly_scores
        WHERE machine_id = $1
          AND ts_bucket BETWEEN $2::timestamptz AND $3::timestamptz
        ORDER BY ts_bucket DESC
        LIMIT 1
      )
      SELECT
        ls.machine_id,
        ls.ts,
        ls.hot_code,
        ls.topic,
        ls.exec_program,
        ls.exec_step,
        ls.exec_state,
        ls.operating_mode,
        ls.motor_power_state,
        ls.joint_angle,
        ls.joint_cmd,
        ls.joint_dev,
        ls.joint_speed,
        ls.motor_current,
        ls.motor_current_cmd,
        la.score,
        la.threshold_warn,
        la.threshold_crit,
        la.state,
        la.top_axes,
        la.top_features
      FROM latest_state ls
      LEFT JOIN latest_anomaly la ON TRUE
    `,
    [machineId, filters.from, filters.to]
  );

  const row = rows[0];
  if (!row) return null;

  const { rows: anomalyTrend } = await pool.query<DbRow>(
    `
      SELECT
        date_bin(make_interval(mins => $4), ts_bucket, TIMESTAMPTZ '2000-01-01 00:00:00+00') AS ts,
        AVG(score) AS score,
        AVG(threshold_warn) AS threshold_warn,
        AVG(threshold_crit) AS threshold_crit
      FROM machine_anomaly_scores
      WHERE machine_id = $1
        AND ts_bucket BETWEEN $2::timestamptz AND $3::timestamptz
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    [machineId, filters.from, filters.to, bucketMinutes(filters.from, filters.to)]
  );

  return {
    latest: {
      machineId,
      ts: String(row.ts),
      hotCode: (row.hot_code as string | null) ?? null,
      topic: (row.topic as string | null) ?? null,
      execProgram: (row.exec_program as string | null) ?? null,
      execStep: toNumber(row.exec_step),
      execState: toNumber(row.exec_state),
      operatingMode: toNumber(row.operating_mode),
      motorPowerState: toNumber(row.motor_power_state),
      score: toNumber(row.score),
      thresholdWarn: toNumber(row.threshold_warn),
      thresholdCrit: toNumber(row.threshold_crit),
      state: (row.state as string | null) ?? "normal"
    },
    axes: {
      joint_angle: toAxisValues(row.joint_angle),
      joint_cmd: toAxisValues(row.joint_cmd),
      joint_dev: toAxisValues(row.joint_dev),
      joint_speed: toAxisValues(row.joint_speed),
      motor_current: toAxisValues(row.motor_current),
      motor_current_cmd: toAxisValues(row.motor_current_cmd)
    },
    anomalyTrend: anomalyTrend.map((point) => ({
      ts: String(point.ts),
      score: toNumber(point.score),
      thresholdWarn: toNumber(point.threshold_warn),
      thresholdCrit: toNumber(point.threshold_crit)
    })),
    topAxes: parseTopAxes(row.top_axes),
    topFeatures: parseTopFeatures(row.top_features)
  };
}

export async function getMachineMetricTrend(
  machineId: string,
  metric: AxisMetric,
  filters: Required<DashboardFilters>
): Promise<MetricTrendPoint[]> {
  const { rows } = await pool.query<DbRow>(
    `
      SELECT
        date_bin(make_interval(mins => $4), ts, TIMESTAMPTZ '2000-01-01 00:00:00+00') AS ts,
        AVG(${metric}[1]) AS j1,
        AVG(${metric}[2]) AS j2,
        AVG(${metric}[3]) AS j3,
        AVG(${metric}[4]) AS j4,
        AVG(${metric}[5]) AS j5,
        AVG(${metric}[6]) AS j6,
        AVG(${metric}[7]) AS j7
      FROM machine_state
      WHERE machine_id = $1
        AND ts BETWEEN $2::timestamptz AND $3::timestamptz
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    [machineId, filters.from, filters.to, bucketMinutes(filters.from, filters.to)]
  );

  return rows.map((row) => ({
    ts: String(row.ts),
    values: [
      { axis: "J1", value: toNumber(row.j1) },
      { axis: "J2", value: toNumber(row.j2) },
      { axis: "J3", value: toNumber(row.j3) },
      { axis: "J4", value: toNumber(row.j4) },
      { axis: "J5", value: toNumber(row.j5) },
      { axis: "J6", value: toNumber(row.j6) },
      { axis: "J7", value: toNumber(row.j7) }
    ]
  }));
}

export async function getAlerts(filters: Required<DashboardFilters>): Promise<AlertsPayload> {
  const rows = await getLatestJoinedRows(filters);
  const alerts = rows.map((row, index) => {
    const topAxes = parseTopAxes(row.top_axes).map((item) => item.name);
    const topFeatures = parseTopFeatures(row.top_features).map((item) => item.name);
    return {
      priority: index + 1,
      machineId: String(row.machine_id),
      hotCode: (row.hot_code as string | null) ?? null,
      timestamp: String((row.ts_bucket as string | null) ?? row.ts),
      score: toNumber(row.score),
      thresholdWarn: toNumber(row.threshold_warn),
      thresholdCrit: toNumber(row.threshold_crit),
      state: (row.state as string | null) ?? "normal",
      topAxes,
      topFeatures,
      suggestedInspectionFocus: summarizeInspectionFocus(topAxes, topFeatures)
    };
  });

  return {
    criticalCount: alerts.filter((row) => row.state === "critical").length,
    warningCount: alerts.filter((row) => row.state === "warning").length,
    topTenMachines: alerts.slice(0, 10),
    priorityTable: alerts,
    topAxisFrequency: countFrequency(alerts.flatMap((row) => row.topAxes), /^J[1-7]$/),
    topFeatureFrequency: countFrequency(alerts.flatMap((row) => row.topFeatures)).slice(0, 10)
  };
}

export function parseFiltersFromRequest(url: string) {
  return normalizeFilters(new URL(url).searchParams);
}
