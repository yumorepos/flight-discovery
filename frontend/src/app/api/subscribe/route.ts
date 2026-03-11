import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.FLIGHT_API_BASE_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ detail: "Unable to reach subscription service" }, { status: 502 });
  }
}
