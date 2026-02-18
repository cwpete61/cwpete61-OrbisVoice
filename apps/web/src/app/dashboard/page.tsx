"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AgentForm from "../../components/AgentForm";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";

export default function DashboardPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [stats, setStats] = useState({ totalAgents: 0, totalConversations: 0, avgDuration: 0 });

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
    }
  }, [tokenLoaded]);

  const fetchStats = async () => {
    // TODO: Create stats endpoint in API
    // For now, use placeholder
    setStats({
      totalAgents: agents.length,
      totalConversations: 0,
      avgDuration: 0,
    });
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`, {
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

  const handleCreateAgent = async (data: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await fetchAgents();
        setShowForm(false);
        alert("Agent created successfully!");
      } else {
        throw new Error("Failed to create agent");
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateAgent = async (data: any) => {
    if (!editingAgent) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${editingAgent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await fetchAgents();
        setEditingAgent(null);
        setShowForm(false);
        alert("Agent updated successfully!");
      } else {
        throw new Error("Failed to update agent");
      }
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${agentId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });

      if (res.ok) {
        await fetchAgents();
        alert("Agent deleted successfully!");
      } else {
        throw new Error("Failed to delete agent");
      }
    } catch (err) {
      console.error("Failed to delete agent:", err);
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
          <button
            onClick={() => { setEditingAgent(null); setShowForm(true); }}
            className="btn-primary text-sm"
          >
            + New Agent
          </button>
        </div>

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

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0c111d] p-8 shadow-2xl">
              <h2 className="mb-6 text-lg font-bold text-[#f0f4fa]">
                {editingAgent ? "Edit Agent" : "Create Agent"}
              </h2>
              <AgentForm
                agent={editingAgent}
                onSubmit={editingAgent ? handleUpdateAgent : handleCreateAgent}
                onCancel={() => { setShowForm(false); setEditingAgent(null); }}
              />
            </div>
          </div>
        )}

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
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary mt-6 text-sm"
            >
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent: any) => (
              <div
                key={agent.id}
                className="group rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 transition hover:border-[#14b8a6]/40"
              >
                {/* Agent header */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#14b8a6]/10 text-[#14b8a6]">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                  <span className="rounded-md bg-[#14b8a6]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#14b8a6]">
                    {agent.voiceModel || "default"}
                  </span>
                </div>

                <h3 className="mb-1.5 font-semibold text-[#f0f4fa] group-hover:text-[#14b8a6] transition">
                  {agent.name}
                </h3>
                <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-[rgba(240,244,250,0.45)]">
                  {agent.systemPrompt}
                </p>

                <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 text-xs">
                  <span className="text-[rgba(240,244,250,0.3)]">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/agents/${agent.id}/conversations`}
                      className="text-[#14b8a6] hover:underline"
                    >
                      Conversations
                    </Link>
                    <button
                      onClick={() => { setEditingAgent(agent); setShowForm(true); }}
                      className="text-[rgba(240,244,250,0.5)] hover:text-[#f0f4fa] transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="text-[#f97316]/70 hover:text-[#f97316] transition"
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
