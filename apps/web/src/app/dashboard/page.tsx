"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orbit-blue via-void to-slate">
      {/* Dashboard Header */}
      <nav className="border-b border-slate px-6 py-4 bg-orbit-blue/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-signal-cyan">Dashboard</div>
          <Link href="/" className="text-slate hover:text-signal-cyan">
            Logout
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-mist">Your Voice Agents</h1>
          <button className="bg-signal-cyan text-orbit-blue px-6 py-2 rounded font-semibold hover:bg-aurora-green transition">
            + Create Agent
          </button>
        </div>

        {loading ? (
          <p className="text-slate">Loading agents...</p>
        ) : agents.length === 0 ? (
          <div className="bg-slate/20 border border-slate rounded-lg p-12 text-center">
            <p className="text-slate mb-4">No agents created yet</p>
            <button className="bg-plasma-orange text-white px-6 py-2 rounded hover:bg-aurora-green transition">
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent: any) => (
              <div key={agent.id} className="bg-slate/20 border border-slate rounded-lg p-6 hover:border-signal-cyan transition">
                <h3 className="text-xl font-semibold text-signal-cyan mb-2">{agent.name}</h3>
                <p className="text-slate text-sm mb-4">{agent.systemPrompt}</p>
                <div className="space-x-2">
                  <button className="text-signal-cyan hover:text-aurora-green text-sm">Edit</button>
                  <button className="text-plasma-orange hover:text-aurora-green text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
