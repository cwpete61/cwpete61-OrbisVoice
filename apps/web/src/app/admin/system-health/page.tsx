"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/DashboardShell";
import { apiFetch } from "@/lib/api";

export default function SystemHealthPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await apiFetch<any>("/admin/stats");

        if (!data?.data) {
          setError("Failed to load system health");
          return;
        }

        setStats(data.data);
      } catch {
        setError("Failed to connect to API");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  if (!stats) {
    return (
      <DashboardShell>
        <div className="p-8">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
            <p className="text-[rgba(240,244,250,0.6)]">
              {error || "You do not have permission to view this page."}
            </p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-[#f0f4fa]">System Health</h1>
          <p className="mt-2 text-[rgba(240,244,250,0.5)]">
            Monitor infrastructure and runtime status.
          </p>
        </header>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0c111d] p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Infrastructure Status
          </h2>
          <div className="space-y-6">
            <HealthIndicator
              label="Core API"
              status={stats?.systemHealth?.api}
              description="Edge runtime and handlers"
            />
            <HealthIndicator
              label="Database"
              status={stats?.systemHealth?.database}
              description="PostgreSQL persistence layer"
            />
            <HealthIndicator
              label="Redis Cache"
              status={stats?.systemHealth?.redis}
              description="Session and rate-limit engine"
            />
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.4)] mb-4">
              Runtime Snapshot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <Metric label="Total Users" value={stats?.totalUsers ?? 0} />
              <Metric label="Total Tenants" value={stats?.totalTenants ?? 0} />
              <Metric label="Total Agents" value={stats?.totalAgents ?? 0} />
              <Metric label="Total Leads" value={stats?.totalLeads ?? 0} />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function HealthIndicator({ label, status, description }: any) {
  const isOk = status === "operational";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-[#f0f4fa]">{label}</span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isOk ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
        >
          {status || "Unknown"}
        </span>
      </div>
      <p className="text-[10px] text-[rgba(240,244,250,0.3)]">{description}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-[#111827] p-3">
      <p className="text-[10px] text-[rgba(240,244,250,0.4)] uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#14b8a6]">{value}</p>
    </div>
  );
}
