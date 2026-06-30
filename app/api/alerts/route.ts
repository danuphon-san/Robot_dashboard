import { NextRequest, NextResponse } from "next/server";
import { getAlerts, parseFiltersFromRequest } from "@/lib/dashboard-queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const data = await getAlerts(parseFiltersFromRequest(request.url));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to load alerts.",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
