"use client";

import { useState } from "react";

interface AgentFormProps {
  agent?: {
    id: string;
    name: string;
    systemPrompt: string;
    voiceModel?: string;
  };
  onSubmit: (data: { name: string; systemPrompt: string; voiceModel?: string }) => Promise<void>;
  onCancel: () => void;
}

export default function AgentForm({ agent, onSubmit, onCancel }: AgentFormProps) {
  const [name, setName] = useState(agent?.name || "");
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt || "");
  const [voiceModel, setVoiceModel] = useState(agent?.voiceModel || "neural");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit({ name, systemPrompt, voiceModel });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-slate/30 border border-slate rounded-lg p-8 w-full max-w-2xl"
      >
        <h2 className="text-2xl font-bold text-signal-cyan mb-6">
          {agent ? "Edit Agent" : "Create New Agent"}
        </h2>

        {error && (
          <div className="bg-plasma-orange/20 border border-plasma-orange text-plasma-orange p-3 rounded mb-4 text-sm">
            Error: {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Agent Name */}
          <div>
            <label className="block text-mist mb-2 font-semibold">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sales Assistant, Support Bot"
              className="w-full bg-orbit-blue border border-slate px-4 py-2 rounded text-mist placeholder-slate focus:outline-none focus:border-signal-cyan"
              required
              maxLength={255}
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-mist mb-2 font-semibold">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define how the agent should behave, tone, and handle conversations..."
              className="w-full bg-orbit-blue border border-slate px-4 py-2 rounded text-mist placeholder-slate focus:outline-none focus:border-signal-cyan h-32 resize-none"
              required
            />
            <p className="text-slate text-xs mt-1">
              {systemPrompt.length} / 2000 characters
            </p>
          </div>

          {/* Voice Model Selection */}
          <div>
            <label className="block text-mist mb-2 font-semibold">Voice Model</label>
            <select
              value={voiceModel}
              onChange={(e) => setVoiceModel(e.target.value)}
              className="w-full bg-orbit-blue border border-slate px-4 py-2 rounded text-mist focus:outline-none focus:border-signal-cyan"
            >
              <option value="neural">Neural (Natural)</option>
              <option value="standard">Standard</option>
              <option value="wavenet">WaveNet (Premium)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || !name || !systemPrompt}
              className="flex-1 bg-signal-cyan text-orbit-blue py-2 rounded font-semibold hover:bg-aurora-green transition disabled:opacity-50"
            >
              {loading ? "Saving..." : agent ? "Update Agent" : "Create Agent"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate/50 text-mist py-2 rounded font-semibold hover:bg-slate/70 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
