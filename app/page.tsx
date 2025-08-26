"use client";

import { useEffect, useState } from "react";

type HealthStatus = {
  authReachable: boolean | null;
  dbReachable: boolean | null;
};

export default function DashboardPage() {
  const [status, setStatus] = useState<HealthStatus>({
    authReachable: null,
    dbReachable: null,
  });

  useEffect(() => {
    const checkHealth = async () => {
      const checks: HealthStatus = {
        authReachable: null,
        dbReachable: null,
      };

      // Check API health
      try {
        const res = await fetch("/api/health");
        const json = await res.json();
        checks.dbReachable = json.ok === true;
        checks.authReachable = true; // if API responds, auth infra is alive
      } catch {
        checks.dbReachable = false;
        checks.authReachable = false;
      }

      setStatus(checks);
    };

    checkHealth();
  }, []);

  const Badge = ({
    label,
    ok,
  }: {
    label: string;
    ok: boolean | null;
  }) => {
    const color =
      ok === null ? "bg-gray-400" : ok ? "bg-green-500" : "bg-red-500";
    const text =
      ok === null ? "Checking..." : ok ? "Online" : "Offline";

    return (
      <div className="flex items-center space-x-2">
        <span className={`w-3 h-3 rounded-full ${color}`}></span>
        <span className="font-medium">{label}</span>
        <span className="text-sm text-gray-500">{text}</span>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          YaraGlow Dashboard
        </h1>
        <p className="text-gray-600">
          System health check — status of core services:
        </p>

        <div className="space-y-4">
          <Badge label="Authentication" ok={status.authReachable} />
          <Badge label="Database" ok={status.dbReachable} />
        </div>

        <div className="mt-8 border-t pt-6 text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </main>
  );
}