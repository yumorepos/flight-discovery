import { NextRequest, NextResponse } from "next/server";
import { buildDemoFlights } from "@/lib/demoFlights";

const API_BASE_URL = process.env.FLIGHT_API_BASE_URL ?? "http://localhost:8000";
const API_TIMEOUT_MS = Number(process.env.FLIGHT_API_TIMEOUT_MS ?? 7000);
const ENABLE_DEMO_FALLBACK = process.env.FLIGHT_DEMO_FALLBACK !== "false";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.name === "AbortError") return "Flight API timed out";
    return error.message;
  }
  return "Unknown API error";
};

const demoResponse = (request: NextRequest, reason: string, status = 200) => {
  const origin = request.nextUrl.searchParams.get("origin") ?? "YUL";
  const month = request.nextUrl.searchParams.get("month") ?? undefined;
  const destination = request.nextUrl.searchParams.get("destination") ?? undefined;
  const flights = buildDemoFlights(origin, month, destination);

  return NextResponse.json(flights, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "x-flight-source": "demo-fallback",
      "x-flight-fallback-reason": reason,
    },
  });
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/search?${query}`, {
      next: { revalidate: 180 },
      headers: { "x-flight-cache": "edge-revalidate" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (ENABLE_DEMO_FALLBACK && response.status >= 500) {
        return demoResponse(request, `upstream-${response.status}`);
      }

      let detail = "Unable to load fares from upstream API";
      try {
        const payload = await response.json();
        detail = payload?.detail ?? detail;
      } catch {
        // ignore parse issue and use generic detail
      }

      return NextResponse.json({ detail }, { status: response.status });
    }

    const payload = await response.json();
    return NextResponse.json(payload, {
      status: response.status,
      headers: {
        "Cache-Control": "s-maxage=180, stale-while-revalidate=300",
        "x-flight-source": "live-api",
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (!ENABLE_DEMO_FALLBACK) {
      return NextResponse.json({ detail: getErrorMessage(error) }, { status: 502 });
    }

    return demoResponse(request, getErrorMessage(error));
  }
}
