import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.FLIGHT_API_BASE_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  try {
    const response = await fetch(`${API_BASE_URL}/api/search?${query}`, {
      next: { revalidate: 180 },
      headers: { "x-flight-cache": "edge-revalidate" },
    });
    const payload = await response.json();
    return NextResponse.json(payload, {
      status: response.status,
      headers: {
        "Cache-Control": "s-maxage=180, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json({ detail: "Unable to reach flight API" }, { status: 502 });
  }
}
