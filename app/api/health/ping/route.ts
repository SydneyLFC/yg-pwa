// app/api/health/ping/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const now = Date.now();
  return NextResponse.json({
    epochMs: now,
    serverTime: new Date(now).toISOString(),
  });
}