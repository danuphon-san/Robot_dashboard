import { NextRequest, NextResponse } from "next/server";
import { getMachines, parseFiltersFromRequest } from "@/lib/dashboard-queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const data = await getMachines(parseFiltersFromRequest(request.url));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to load machines.",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
