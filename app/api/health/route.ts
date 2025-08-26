// app/api/health/route.ts
import { NextResponse } from "next/server";

// Ensure we always run fresh (no static caching)
export const dynamic = "force-dynamic";

// Optional: mark as edge-friendly; comment out if you prefer node runtime
export const runtime = "edge"; // or "nodejs"

type HealthPayload = {
  ok: boolean;
  apiOk: boolean;
  authReachable: boolean | null;
  dbReachable: boolean | null;
  storageOk: boolean | null;
  edgeOk: boolean | null;
  analyticsOk: boolean | null;
  timestamp: string;
  meta?: Record<string, unknown>;
};

// Lightweight randomizer with slight persistence in a window
function softFlip(base = true, chance = 0.08) {
  // 8% chance to flip status on any request
  return Math.random() < chance ? !base : base;
}

export async function GET() {
  const start = Date.now();

  // Simulate some work (20–120ms)
  const jitter = 20 + Math.floor(Math.random() * 100);
  await new Promise((r) => setTimeout(r, jitter));

  // Derive statuses (you can replace with real checks)
  const apiOk = softFlip(true, 0.02);
  const authReachable = softFlip(true, 0.05);
  const dbReachable = softFlip(true, 0.05);
  const storageOk = softFlip(true, 0.03);
  const edgeOk = softFlip(true, 0.04);
  const analyticsOk = softFlip(true, 0.06);

  // Aggregate
  const statuses = [apiOk, authReachable, dbReachable, storageOk, edgeOk, analyticsOk];
  const ok = statuses.every((s) => s !== false); // if any hard-fail → overall false

  const payload: HealthPayload = {
    ok,
    apiOk,
    authReachable,
    dbReachable,
    storageOk,
    edgeOk,
    analyticsOk,
    timestamp: new Date().toISOString(),
    meta: {
      region: process.env.VERCEL_REGION ?? "local",
      env: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      measuredLatencyMs: Date.now() - start,
      commit: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      service: "health-endpoint",
    },
  };

  return NextResponse.json(payload, {
    headers: {
      // prevent CDN/browser caching
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}