"use client";

import { Suspense, useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";
import { API_BASE } from "@/lib/api";

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

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

interface StatsChartData {
  name: string;
  "Agent Sales": number;
  "Referrer Sales": number;
  "Total Sales": number;
}

function StatsContent() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<StatsChartData[]>([]);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const tokenLoaded = useTokenFromUrl();

  useEffect(() => {
    if (tokenLoaded) {
      fetchStats();
    }
  }, [tokenLoaded]);

  async function fetchStats() {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      const userEmail = payload?.email;
      const isAdminUser = userEmail === "myorbislocal@gmail.com" || userEmail === "admin@orbisvoice.app" || userEmail === "myorbisvoice@gmail.com";
      setIsSystemAdmin(isAdminUser);

      // Fetch dashboard stats
      const [resDash, resChart] = await Promise.all([
        fetch(`${API_BASE}/stats/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
        isAdminUser ? fetch(`${API_BASE}/stats/sales-chart`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null)
      ]);

      if (resDash.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }

      const dashData = await resDash.json();
      setDashboardStats(dashData.data);

      if (resChart && resChart.ok) {
        const cData = await resChart.json();
        if (cData.ok) {
          setChartData(cData.data);
        }
      }

    } catch (err: any) {
      setError(err.message || "Failed to load statistics");
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="px-8 py-8">
          <div className="text-center py-12">
            <p className="text-[rgba(240,244,250,0.5)]">Loading statistics...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell tokenLoaded={tokenLoaded}>
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

            {/* Sales Chart (Admin Only) */}
            {isSystemAdmin && chartData.length > 0 && (
              <div className="mb-8 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                <h2 className="mb-4 text-sm font-semibold text-[#f0f4fa]">Gross Revenue by Channel (Est.)</h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#0c111d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#f0f4fa' }}
                      />
                      <Legend iconType="circle" />
                      <Line type="monotone" dataKey="Total Sales" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Agent Sales" stroke="#a78bfa" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Referrer Sales" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

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

export default function StatsPage() {
  return (
    <Suspense>
      <StatsContent />
    </Suspense>
  );
}