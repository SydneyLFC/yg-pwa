// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** ---------------------------
 * Types matching /api/health
 * --------------------------- */
type HealthResponse = {
  authReachable: boolean;
  dbReachable: boolean;
  storageReachable: boolean;
  version: string;
  uptimeSeconds: number;
};

type PingResponse = {
  epochMs: number;
  serverTime: string;
};

/** ---------------------------
 * Helpers
 * --------------------------- */
function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatUptime(totalSeconds: number) {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pieces = [];
  if (d) pieces.push(`${d}d`);
  if (h || d) pieces.push(`${h}h`);
  if (m || h || d) pieces.push(`${m}m`);
  pieces.push(`${s}s`);
  return pieces.join(" ");
}

function statusColor(ok: boolean) {
  return ok ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30";
}

function dotColor(ok: boolean) {
  return ok ? "bg-emerald-400" : "bg-rose-400";
}

/** ---------------------------
 * Page
 * --------------------------- */
export default function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [rttMs, setRttMs] = useState<number | null>(null);
  const [skewMs, setSkewMs] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setHealthError(null);
    try {
      const resp = await fetch("/api/health", { cache: "no-store" });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || `HTTP ${resp.status}`);
      }
      const json: HealthResponse = await resp.json();
      setHealth(json);
      setLastUpdated(new Date());
    } catch (err: any) {
      setHealthError(err?.message || "Failed to load health.");
    } finally {
      setLoading(false);
    }
  };

  const ping = async () => {
    const start = performance.now();
    try {
      const resp = await fetch("/api/health/ping", { cache: "no-store" });
      const json: PingResponse = await resp.json();
      const end = performance.now();
      const rtt = end - start;
      setRttMs(Math.round(rtt));
      // Rough skew: serverEpoch - (clientMidpoint)
      const clientMid = (start + end) / 2;
      setSkewMs(Math.round(json.epochMs - clientMid));
    } catch {
      setRttMs(null);
      setSkewMs(null);
    }
  };

  useEffect(() => {
    // Initial load
    fetchHealth();
    ping();

    // Periodic refresh
    refreshTimer.current = setInterval(fetchHealth, 30_000); // every 30s
    pingTimer.current = setInterval(ping, 15_000); // every 15s

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      if (pingTimer.current) clearInterval(pingTimer.current);
    };
  }, []);

  const overallOK = useMemo(() => {
    if (!health) return null;
    return health.authReachable && health.dbReachable && health.storageReachable;
  }, [health]);

  return (
    <main className="min-h-[100svh] bg-neutral-950 text-neutral-100">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-neutral-800/70 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30 grid place-items-center">
              <span className="block size-2 rounded-full bg-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight">YaraGlow • System Health</h1>
              <p className="text-xs text-neutral-400">Mobile-first dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchHealth();
                ping();
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-neutral-700 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-800 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Overall status & metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="col-span-1 md:col-span-2 rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-semibold">Overall</h2>
              {overallOK !== null && (
                <span
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium",
                    statusColor(overallOK)
                  )}
                >
                  <span className={clsx("size-1.5 rounded-full", dotColor(overallOK))} />
                  {overallOK ? "Healthy" : "Issues detected"}
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-400">
              Real-time snapshot of core services. As the stack grows, extend this card with more signals.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatusPill
                label="Auth"
                ok={!!health?.authReachable}
                loading={loading}
                description="Token & session endpoints reachable."
              />
              <StatusPill
                label="Database"
                ok={!!health?.dbReachable}
                loading={loading}
                description="Primary data operations responding."
              />
              <StatusPill
                label="Storage"
                ok={!!health?.storageReachable}
                loading={loading}
                description="Object storage probe healthy."
              />
            </div>
          </div>

          <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-4 md:p-5">
            <h2 className="text-base md:text-lg font-semibold mb-3">Runtime</h2>
            <div className="space-y-2">
              <MetricRow label="Uptime" value={health ? formatUptime(health.uptimeSeconds) : "—"} />
              <MetricRow label="Version" value={health?.version ?? "—"} />
              <MetricRow label="RTT" value={rttMs !== null ? `${rttMs} ms` : "—"} />
              <MetricRow label="Clock Skew" value={skewMs !== null ? `${skewMs} ms` : "—"} />
              <MetricRow
                label="Updated"
                value={lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
                subtle
              />
            </div>
          </div>
        </section>

        {/* Connectivity mini-chart */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-4 md:p-5">
            <h2 className="text-base md:text-lg font-semibold">Connectivity Pulse</h2>
            <p className="text-sm text-neutral-400 mt-1">
              Measures round-trip time to <code className="text-neutral-300">/api/health/ping</code> every 15s.
            </p>
            <PulseGauge value={rttMs} />
          </div>

          <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-4 md:p-5">
            <h2 className="text-base md:text-lg font-semibold">Notes</h2>
            {healthError ? (
              <div className="mt-2 rounded-lg bg-rose-500/10 ring-1 ring-rose-500/30 p-3 text-sm text-rose-300">
                {healthError}
              </div>
            ) : (
              <ul className="mt-2 text-sm text-neutral-300 space-y-2 list-disc pl-5">
                <li>This dashboard auto-refreshes. Use <em>Refresh</em> for a manual pull.</li>
                <li>
                  Health checks are stubbed — wire <code>checkDbReachable()</code> / <code>checkStorageReachable()</code> to your
                  real services when ready.
                </li>
                <li>RTT is measured client-side; values vary with network conditions.</li>
              </ul>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-2 pb-8 text-center text-xs text-neutral-500">
          Built with Next.js App Router • Tailwind • PWA ready
        </footer>
      </div>
    </main>
  );
}

/** ---------------------------
 * Subcomponents
 * --------------------------- */

function StatusPill(props: {
  label: string;
  ok: boolean;
  loading?: boolean;
  description?: string;
}) {
  const { label, ok, loading, description } = props;
  return (
    <div className="rounded-xl ring-1 ring-neutral-800 bg-neutral-900 p-3 md:p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-200">{label}</span>
        <span
          className={clsx(
            "inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs font-medium",
            loading ? "bg-neutral-800 text-neutral-300 ring-1 ring-neutral-700" : statusColor(ok)
          )}
        >
          <span className={clsx("size-1.5 rounded-full", loading ? "bg-neutral-400" : dotColor(ok))} />
          {loading ? "Checking…" : ok ? "OK" : "Down"}
        </span>
      </div>
      {description && <p className="mt-1 text-xs text-neutral-400">{description}</p>}
    </div>
  );
}

function MetricRow(props: { label: string; value: string; subtle?: boolean }) {
  const { label, value, subtle } = props;
  return (
    <div className="flex items-center justify-between">
      <span className={clsx("text-xs", subtle ? "text-neutral-500" : "text-neutral-300")}>{label}</span>
      <span className={clsx("text-sm tabular-nums", subtle ? "text-neutral-500" : "text-neutral-100")}>{value}</span>
    </div>
  );
}

function PulseGauge({ value }: { value: number | null }) {
  // Map RTT to 0–100%
  const pct = useMemo(() => {
    if (value === null) return null;
    // 0–100ms = green, 100–300ms = amber, >300ms = red (cap 600ms)
    const clamped = Math.max(0, Math.min(600, value));
    return Math.round((clamped / 600) * 100);
  }, [value]);

  const barColor =
    value === null
      ? "bg-neutral-700"
      : value <= 100
      ? "bg-emerald-500"
      : value <= 300
      ? "bg-amber-400"
      : "bg-rose-500";

  return (
    <div className="mt-3">
      <div className="h-2 w-full rounded-full bg-neutral-800 ring-1 ring-neutral-700 overflow-hidden">
        <div
          className={clsx("h-full transition-all duration-500", barColor)}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
        <span>0 ms</span>
        <span>{value !== null ? `${value} ms` : "—"}</span>
        <span>600 ms</span>
      </div>
    </div>
  );
}