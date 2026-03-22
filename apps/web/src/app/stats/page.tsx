"use client";

import { Suspense, useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";
import { API_BASE, authHeader, unwrapJson } from "@/lib/api";

interface DashboardStats {
  totalAgents: number;
  totalConversations: number;
  avgDurationMinutes: number;
  totalDurationMinutes: number;
  recentConversationsLast7Days: number;
}

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StatsChartData {
  name: string;
  "Agent Sales": number;
  "Referrer Sales": number;
  "Total Sales": number;
}

function StatsContent() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<StatsChartData[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      const isAdminUser =
        userEmail === "myorbislocal@gmail.com" ||
        userEmail === "admin@orbisvoice.app" ||
        userEmail === "myorbisvoice@gmail.com";
      setIsSystemAdmin(isAdminUser);

      const headers = { Authorization: `Bearer ${token}` };
      const [dashRes, chartRes, trendRes] = await Promise.all([
        fetch(`${API_BASE}/stats/dashboard`, { headers }),
        isAdminUser ? fetch(`${API_BASE}/stats/sales-chart`, { headers }) : Promise.resolve(null),
        fetch(`${API_BASE}/stats/usage-trend`, { headers }),
      ]);

      const [dashData, cData, tData] = await Promise.all([
        unwrapJson<{ data: DashboardStats }>(dashRes),
        chartRes ? unwrapJson<{ data: StatsChartData[] }>(chartRes) : Promise.resolve(null),
        unwrapJson<{ data: any[] }>(trendRes),
      ]);

      setDashboardStats(dashData.data);
      if (cData) setChartData(cData.data);
      if (tData) setTrendData(tData.data);
    } catch (err: any) {
      setError(err.message || "Failed to load statistics");
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats/export`, { headers: authHeader() });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversations_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Failed to export data");
    }
  };

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#f0f4fa]">Analytics</h1>
            <p className="mt-0.5 text-sm text-[rgba(240,244,250,0.45)]">
              Agent performance and conversation metrics
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-white/[0.05] border border-white/[0.1] px-4 py-2 text-xs font-semibold text-[#f0f4fa] hover:bg-white/[0.1] transition"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {dashboardStats ? (
          <>
            {/* Stat strip */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Total Agents", value: dashboardStats.totalAgents, color: "#14b8a6" },
                {
                  label: "Conversations",
                  value: dashboardStats.totalConversations,
                  color: "#f0f4fa",
                },
                {
                  label: "Avg Duration",
                  value: `${dashboardStats.avgDurationMinutes}m`,
                  color: "#f97316",
                },
                {
                  label: "Total Hours",
                  value: `${Math.round(dashboardStats.totalDurationMinutes / 60)}h`,
                  color: "#f0f4fa",
                },
                {
                  label: "Last 7 Days",
                  value: dashboardStats.recentConversationsLast7Days,
                  color: "#14b8a6",
                },
                {
                  label: "Daily Avg",
                  value: Math.round(dashboardStats.recentConversationsLast7Days / 7),
                  color: "#f0f4fa",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/[0.07] bg-[#0c111d] p-5"
                >
                  <p className="text-xs text-[rgba(240,244,250,0.45)]">{s.label}</p>
                  <p className="mt-2 text-3xl font-bold" style={{ color: s.color }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Conversation Volume Chart */}
            {trendData.length > 0 && (
              <div className="mb-8 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#f0f4fa]">
                    Conversation Volume (Last 30 Days)
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#14b8a6]"></span>
                    <span className="text-[10px] text-[rgba(240,244,250,0.45)] uppercase tracking-wider">
                      Conversations
                    </span>
                  </div>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(240,244,250,0.3)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) =>
                          new Date(val).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis
                        stroke="rgba(240,244,250,0.3)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#1a1f2e",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        itemStyle={{ color: "#14b8a6" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#14b8a6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#14b8a6", strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Sales Chart (Admin Only) */}
            {isSystemAdmin && chartData.length > 0 && (
              <div className="mb-8 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                <h2 className="mb-4 text-sm font-semibold text-[#f0f4fa]">
                  Gross Revenue by Channel (Est.)
                </h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="name"
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `$${val}`}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#0c111d",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                        }}
                        itemStyle={{ color: "#f0f4fa" }}
                      />
                      <Legend iconType="circle" />
                      <Line
                        type="monotone"
                        dataKey="Total Sales"
                        stroke="#14b8a6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Agent Sales"
                        stroke="#a78bfa"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Referrer Sales"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
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
                    title: "Engagement",
                    color: "#14b8a6",
                    rows: [
                      [
                        "Conversations / Agent",
                        dashboardStats.totalAgents > 0
                          ? (
                              dashboardStats.totalConversations / dashboardStats.totalAgents
                            ).toFixed(1)
                          : "0",
                      ],
                      ["Total Interactions", dashboardStats.totalConversations],
                    ] as [string, string | number][],
                  },
                  {
                    title: "Duration",
                    color: "#a78bfa",
                    rows: [
                      ["Average Time", `${dashboardStats.avgDurationMinutes}m`],
                      ["Total Time", `${Math.round(dashboardStats.totalDurationMinutes / 60)}h`],
                    ] as [string, string | number][],
                  },
                  {
                    title: "Activity",
                    color: "#f97316",
                    rows: [
                      ["Last 7 Days", dashboardStats.recentConversationsLast7Days],
                      [
                        "Daily Average",
                        Math.round(dashboardStats.recentConversationsLast7Days / 7),
                      ],
                    ] as [string, string | number][],
                  },
                ].map((section) => (
                  <div key={section.title}>
                    <p
                      className="mb-4 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: section.color }}
                    >
                      {section.title}
                    </p>
                    <div className="space-y-3">
                      {section.rows.map(([label, val]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between border-b border-white/[0.05] pb-3"
                        >
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
