"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-bold text-cyan-400">
            OrbisVoice
          </Link>
          <Link href="/dashboard" className="text-slate-300 hover:text-white">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Statistics</h1>
        <p className="text-slate-300 mb-12">Track your agent performance and conversation metrics</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Total Agents */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl border border-blue-700 p-6">
              <div className="text-blue-200 text-sm font-semibold mb-2">TOTAL AGENTS</div>
              <div className="text-4xl font-bold text-blue-300 mb-2">{dashboardStats.totalAgents}</div>
              <div className="text-blue-400 text-sm">Active AI agents</div>
            </div>

            {/* Total Conversations */}
            <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl border border-purple-700 p-6">
              <div className="text-purple-200 text-sm font-semibold mb-2">CONVERSATIONS</div>
              <div className="text-4xl font-bold text-purple-300 mb-2">{dashboardStats.totalConversations}</div>
              <div className="text-purple-400 text-sm">Total conversations</div>
            </div>

            {/* Average Duration */}
            <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl border border-green-700 p-6">
              <div className="text-green-200 text-sm font-semibold mb-2">AVG DURATION</div>
              <div className="text-4xl font-bold text-green-300 mb-2">{dashboardStats.avgDurationMinutes}m</div>
              <div className="text-green-400 text-sm">Minutes per conversation</div>
            </div>

            {/* Total Duration */}
            <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-xl border border-amber-700 p-6">
              <div className="text-amber-200 text-sm font-semibold mb-2">TOTAL DURATION</div>
              <div className="text-4xl font-bold text-amber-300 mb-2">{Math.round(dashboardStats.totalDurationMinutes / 60)}h</div>
              <div className="text-amber-400 text-sm">Hours of conversations</div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-cyan-900 to-cyan-800 rounded-xl border border-cyan-700 p-6">
              <div className="text-cyan-200 text-sm font-semibold mb-2">LAST 7 DAYS</div>
              <div className="text-4xl font-bold text-cyan-300 mb-2">{dashboardStats.recentConversationsLast7Days}</div>
              <div className="text-cyan-400 text-sm">Recent conversations</div>
            </div>

            {/* Last Updated */}
            <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl border border-slate-500 p-6">
              <div className="text-slate-300 text-sm font-semibold mb-2">LAST UPDATED</div>
              <div className="text-sm text-slate-400">
                {new Date().toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
              <div className="text-slate-400 text-sm mt-2">Real-time data</div>
            </div>
          </div>
        )}

        {/* Metrics Breakdown */}
        <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-8">
          <h2 className="text-2xl font-bold mb-6">Metrics Breakdown</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">Engagement</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Conversations/Agent</span>
                  <span className="font-bold">
                    {dashboardStats && dashboardStats.totalAgents > 0
                      ? (dashboardStats.totalConversations / dashboardStats.totalAgents).toFixed(1)
                      : "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Total Interactions</span>
                  <span className="font-bold">{dashboardStats?.totalConversations}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-400">Duration</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Average Time</span>
                  <span className="font-bold">{dashboardStats?.avgDurationMinutes} minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Total Time</span>
                  <span className="font-bold">{Math.round((dashboardStats?.totalDurationMinutes || 0) / 60)}h</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-400">Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Last 7 Days</span>
                  <span className="font-bold">{dashboardStats?.recentConversationsLast7Days}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Daily Average</span>
                  <span className="font-bold">
                    {dashboardStats ? Math.round(dashboardStats.recentConversationsLast7Days / 7) : "0"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
