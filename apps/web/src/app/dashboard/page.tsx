"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AgentForm from "@/components/AgentForm";

export default function DashboardPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [stats, setStats] = useState({ totalAgents: 0, totalConversations: 0, avgDuration: 0 });

  useEffect(() => {
    fetchAgents();
    fetchStats();
  }, []);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`);
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
    <div className="min-h-screen bg-gradient-to-br from-orbit-blue via-void to-slate">
      {/* Header */}
      <nav className="border-b border-slate px-6 py-4 bg-orbit-blue/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-signal-cyan">Dashboard</div>
          <div className="space-x-4">
            <Link href="/stats" className="text-slate hover:text-signal-cyan transition">
              Stats
            </Link>
            <Link href="/referrals" className="text-slate hover:text-aurora-green transition">
              Referrals
            </Link>
            <Link href="/settings" className="text-slate hover:text-signal-cyan transition">
              Settings
            </Link>
            <Link href="/test" className="text-slate hover:text-signal-cyan transition">
              Test
            </Link>
            <Link href="/" className="text-slate hover:text-signal-cyan transition">
              Logout
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate/20 border border-slate rounded-lg p-4">
            <p className="text-slate text-sm">Total Agents</p>
            <p className="text-3xl font-bold text-signal-cyan">{agents.length}</p>
          </div>
          <div className="bg-slate/20 border border-slate rounded-lg p-4">
            <p className="text-slate text-sm">Total Conversations</p>
            <p className="text-3xl font-bold text-aurora-green">{stats.totalConversations}</p>
          </div>
          <div className="bg-slate/20 border border-slate rounded-lg p-4">
            <p className="text-slate text-sm">Avg Duration</p>
            <p className="text-3xl font-bold text-plasma-orange">{stats.avgDuration}m</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-mist">Voice Agents</h1>
          <button
            onClick={() => {
              setEditingAgent(null);
              setShowForm(true);
            }}
            className="bg-signal-cyan text-orbit-blue px-6 py-2 rounded font-semibold hover:bg-aurora-green transition"
          >
            + Create Agent
          </button>
        </div>

        {/* Agent Form Modal */}
        {showForm && (
          <AgentForm
            agent={editingAgent}
            onSubmit={editingAgent ? handleUpdateAgent : handleCreateAgent}
            onCancel={() => {
              setShowForm(false);
              setEditingAgent(null);
            }}
          />
        )}

        {/* Agents Grid */}
        {loading ? (
          <p className="text-slate">Loading agents...</p>
        ) : agents.length === 0 ? (
          <div className="bg-slate/20 border border-slate rounded-lg p-12 text-center">
            <p className="text-slate mb-4">No agents created yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-plasma-orange text-white px-6 py-2 rounded hover:bg-aurora-green transition"
            >
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent: any) => (
              <div
                key={agent.id}
                className="bg-slate/20 border border-slate rounded-lg p-6 hover:border-signal-cyan transition group"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-signal-cyan mb-2 group-hover:text-aurora-green transition">
                    {agent.name}
                  </h3>
                  <p className="text-slate text-sm line-clamp-3 mb-3">{agent.systemPrompt}</p>
                  <div className="flex items-center gap-2 text-xs text-slate">
                    <span className="px-2 py-1 bg-orbit-blue/50 rounded">{agent.voiceModel || "default"}</span>
                    <span className="px-2 py-1 bg-orbit-blue/50 rounded">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-x-2">
                  <Link
                    href={`/agents/${agent.id}/conversations`}
                    className="text-aurora-green hover:text-signal-cyan text-sm font-semibold transition"
                  >
                    Conversations
                  </Link>
                  <button
                    onClick={() => {
                      setEditingAgent(agent);
                      setShowForm(true);
                    }}
                    className="text-signal-cyan hover:text-aurora-green text-sm font-semibold transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="text-plasma-orange hover:text-aurora-green text-sm font-semibold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
