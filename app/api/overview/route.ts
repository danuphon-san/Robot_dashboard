import { NextRequest, NextResponse } from "next/server";
import { getOverview, parseFiltersFromRequest } from "@/lib/dashboard-queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const data = await getOverview(parseFiltersFromRequest(request.url));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to load overview.",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
