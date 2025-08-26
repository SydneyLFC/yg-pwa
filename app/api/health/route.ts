// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    authReachable: true,        // stubbed
    dbReachable: true,          // stubbed
    storageReachable: true,     // stubbed
    version: "1.0.0",           // stubbed
    uptimeSeconds: process.uptime(), // Node process uptime in seconds
  });
}