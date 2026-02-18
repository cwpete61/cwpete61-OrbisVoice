"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";

interface DashboardStats {
  totalAgents: number;
  totalConversations: number;
  avgDurationMinutes: number;
  totalDurationMinutes: number;
  recentConversationsLast7Days: number;
}

interface AgentStats {
  agentId: string;
  agentName: string;
  totalConversations: number;
  avgDurationSeconds: number;
  firstConversation: string | null;
  lastConversation: string | null;
  last30DaysTrend: Record<string, number>;
}

export default function StatsPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await fetch("/api/stats/dashboard");

      if (!res.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await res.json();
      setDashboardStats(data.data);
    } catch (err) {
      setError("Failed to load statistics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading statistics...</div>;
  }

  return (
    <DashboardShell>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#f0f4fa]">Analytics</h1>
          <p className="mt-0.5 text-sm text-[rgba(240,244,250,0.45)]">Agent performance and conversation metrics</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        )}

        {dashboardStats ? (
          <>
            {/* Stat strip */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Total Agents", value: dashboardStats.totalAgents, color: "#14b8a6" },
                { label: "Conversations", value: dashboardStats.totalConversations, color: "#f0f4fa" },
                { label: "Avg Duration", value: `${dashboardStats.avgDurationMinutes}m`, color: "#f97316" },
                { label: "Total Hours", value: `${Math.round(dashboardStats.totalDurationMinutes / 60)}h`, color: "#f0f4fa" },
                { label: "Last 7 Days", value: dashboardStats.recentConversationsLast7Days, color: "#14b8a6" },
                { label: "Daily Avg", value: Math.round(dashboardStats.recentConversationsLast7Days / 7), color: "#f0f4fa" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/[0.07] bg-[#0c111d] p-5">
                  <p className="text-xs text-[rgba(240,244,250,0.45)]">{s.label}</p>
                  <p className="mt-2 text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Breakdown */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
              <h2 className="mb-6 text-sm font-semibold text-[#f0f4fa]">Breakdown</h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {[
                  {
                    title: "Engagement", color: "#14b8a6",
                    rows: [
                      ["Conversations / Agent", dashboardStats.totalAgents > 0 ? (dashboardStats.totalConversations / dashboardStats.totalAgents).toFixed(1) : "0"],
                      ["Total Interactions", dashboardStats.totalConversations],
                    ] as [string, string | number][],
                  },
                  {
                    title: "Duration", color: "#a78bfa",
                    rows: [
                      ["Average Time", `${dashboardStats.avgDurationMinutes}m`],
                      ["Total Time", `${Math.round(dashboardStats.totalDurationMinutes / 60)}h`],
                    ] as [string, string | number][],
                  },
                  {
                    title: "Activity", color: "#f97316",
                    rows: [
                      ["Last 7 Days", dashboardStats.recentConversationsLast7Days],
                      ["Daily Average", Math.round(dashboardStats.recentConversationsLast7Days / 7)],
                    ] as [string, string | number][],
                  },
                ].map((section) => (
                  <div key={section.title}>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: section.color }}>{section.title}</p>
                    <div className="space-y-3">
                      {section.rows.map(([label, val]) => (
                        <div key={label} className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                          <span className="text-sm text-[rgba(240,244,250,0.5)]">{label}</span>
                          <span className="text-sm font-semibold text-[#f0f4fa]">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}
