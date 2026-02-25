"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";
import { API_BASE } from "@/lib/api";

function DashboardContent() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAgents: 0, totalConversations: 0, avgDuration: 0 });
  const [subscription, setSubscription] = useState<any>(null);

  // Extract token from URL if present (from OAuth callback)
  const tokenLoaded = useTokenFromUrl();

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    // Only fetch data after token has been processed
    if (tokenLoaded) {
      fetchAgents();
      fetchStats();
      fetchSubscription();
    }
  }, [tokenLoaded]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/stats/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalAgents: data.data?.totalAgents ?? agents.length,
          totalConversations: data.data?.totalConversations ?? 0,
          avgDuration: data.data?.avgDurationMinutes ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/billing/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      const res = await fetch(`${API_BASE}/agents/${agentId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });

      if (res.ok) {
        await fetchAgents();
      } else {
        throw new Error("Failed to delete agent");
      }
    } catch (err) {
      console.error("Failed to delete agent:", err);
    }
  };

  const handleToggleActive = async (agentId: string, currentStatus: boolean) => {
    try {
      // Optimistically update UI
      setAgents(agents.map(a => a.id === agentId ? { ...a, isActive: !currentStatus } : a));

      const res = await fetch(`${API_BASE}/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      // Re-fetch in background to ensure sync
      fetchAgents();
    } catch (err) {
      console.error("Failed to toggle agent active status:", err);
      alert("Could not update agent status. Please try again.");
      // Revert optimistic update
      fetchAgents();
    }
  };

  return (
    <DashboardShell tokenLoaded={tokenLoaded}>
      <div className="px-8 py-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#f0f4fa]">Voice Agents</h1>
            <p className="mt-0.5 text-sm text-[rgba(240,244,250,0.45)]">
              Manage and monitor your deployed agents
            </p>
          </div>
          <Link
            href="/agents/new"
            className="btn-primary text-sm flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            New Agent
          </Link>
        </div>

        {/* Current Plan */}
        {subscription && (
          <section className="mb-8 rounded-2xl border border-[#14b8a6]/20 bg-[#0c111d] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[rgba(240,244,250,0.45)] uppercase tracking-wide">Current Plan</p>
                <p className="mt-3 text-3xl font-bold text-[#14b8a6] capitalize">
                  {subscription.subscriptionTier === "ai-revenue-infrastructure"
                    ? "AI Revenue Infrastructure"
                    : subscription.subscriptionTier}
                </p>
                <p className="mt-1 text-sm text-[rgba(240,244,250,0.6)]">
                  ${subscription.tierInfo?.price || 0}/month
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[rgba(240,244,250,0.45)]">Usage</p>
                <p className="mt-2 text-lg font-semibold text-[#f0f4fa]">
                  {subscription.usageCount} / {subscription.usageLimit}
                </p>
                <p className="mt-1 text-xs text-[rgba(240,244,250,0.45)]">conversations</p>
                <div className="mt-3 h-2 w-32 rounded-full bg-[#080c16] overflow-hidden">
                  <div
                    className="h-full bg-[#14b8a6] transition-all"
                    style={{
                      width: `${Math.min((subscription.usageCount / subscription.usageLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stat strip */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Agents", value: agents.length, color: "#14b8a6" },
            { label: "Conversations", value: stats.totalConversations, color: "#f0f4fa" },
            { label: "Avg Duration", value: `${stats.avgDuration}m`, color: "#f97316" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.07] bg-[#0c111d] p-5">
              <p className="text-xs text-[rgba(240,244,250,0.45)]">{s.label}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Agent grid */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[rgba(240,244,250,0.4)]">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading agents…
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] py-24 text-center">
            <div className="mb-4 h-12 w-12 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center">
              <svg width="24" height="24" fill="none" stroke="#14b8a6" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#f0f4fa]">No agents yet</p>
            <p className="mt-1 text-xs text-[rgba(240,244,250,0.4)]">Create your first voice agent to get started</p>
            <Link
              href="/agents/new"
              className="btn-primary mt-6 text-sm flex items-center gap-2"
            >
              Create Your First Agent
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent: any) => (
              <div
                key={agent.id}
                className={`group rounded-2xl border bg-[#0c111d] p-6 transition flex flex-col ${agent.isActive
                    ? 'border-white/[0.07] hover:border-[#14b8a6]/40'
                    : 'border-white/[0.03] opacity-60 hover:opacity-100 hover:border-white/[0.15]'
                  }`}
              >
                {/* Agent header */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${agent.isActive ? 'bg-[#14b8a6]/10 text-[#14b8a6]' : 'bg-white/[0.05] text-[rgba(240,244,250,0.4)]'
                      }`}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => handleToggleActive(agent.id, agent.isActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:ring-offset-2 focus:ring-offset-[#0c111d] transition-colors ${agent.isActive ? 'bg-[#14b8a6]' : 'bg-gray-600'
                        }`}
                    >
                      <span className="sr-only">Toggle agent active status</span>
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${agent.isActive ? 'translate-x-2' : '-translate-x-2'
                          }`}
                      />
                    </button>

                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${agent.isActive
                        ? 'bg-[#14b8a6]/10 text-[#14b8a6]'
                        : 'bg-white/[0.05] text-[rgba(240,244,250,0.3)]'
                      }`}>
                      {agent.voiceModel || "default"}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className={`mb-1.5 font-semibold transition ${agent.isActive ? 'text-[#f0f4fa] group-hover:text-[#14b8a6]' : 'text-[rgba(240,244,250,0.7)]'
                    }`}>
                    {agent.name}
                  </h3>
                  <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-[rgba(240,244,250,0.45)]">
                    {agent.systemPrompt || <span className="italic">No persona configured</span>}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.05] mt-auto pt-4 text-xs">
                  <span className="text-[rgba(240,244,250,0.3)]">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-3 font-medium">
                    <Link
                      href={`/agents/${agent.id}/conversations`}
                      className="text-[#14b8a6] hover:text-[#0d9488] transition"
                    >
                      Logs
                    </Link>
                    <Link
                      href={`/agents/${agent.id}/edit`}
                      className="text-[rgba(240,244,250,0.5)] hover:text-[#f0f4fa] transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
