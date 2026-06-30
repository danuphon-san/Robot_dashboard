import { NextRequest, NextResponse } from "next/server";
import { getMachineDetail, parseFiltersFromRequest } from "@/lib/dashboard-queries";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ machine_id: string }> }
) {
  try {
    const { machine_id } = await params;
    const data = await getMachineDetail(machine_id, parseFiltersFromRequest(request.url));
    if (!data) {
      return NextResponse.json({ message: "Machine not found." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to load machine detail.",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
