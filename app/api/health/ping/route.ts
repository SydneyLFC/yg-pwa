// app/api/health/ping/route.ts
import { NextResponse } from "next/server";

/**
 * Simple RTT/clock-skew endpoint. The client measures round-trip latency,
 * and we return the server's epoch to estimate skew.
 */
export async function GET() {
  return NextResponse.json(
    {
      epochMs: Date.now(),
      serverTime: new Date().toISOString(),
    },
    { status: 200 }
  );
}