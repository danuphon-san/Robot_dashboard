import { NextRequest, NextResponse } from "next/server";
import { getMachineMetricTrend, parseFiltersFromRequest } from "@/lib/dashboard-queries";
import { AXIS_METRICS, type AxisMetric } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ machine_id: string }> }
) {
  try {
    const { machine_id } = await params;
    const filters = parseFiltersFromRequest(request.url);
    const metric = (request.nextUrl.searchParams.get("metric") ?? filters.metric) as AxisMetric;
    if (!AXIS_METRICS.includes(metric)) {
      return NextResponse.json({ message: "Invalid metric." }, { status: 400 });
    }
    const data = await getMachineMetricTrend(machine_id, metric, filters);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to load machine trend.",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
