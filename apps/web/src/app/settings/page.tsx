"use client";

import { useState, useEffect } from "react";
import DashboardShell from "../components/DashboardShell";

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-keys`);
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowNewKey(data.data.key);
        setNewKeyName("");
        await fetchApiKeys();
      }
    } catch (err) {
      console.error("Failed to create API key:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchApiKeys();
      }
    } catch (err) {
      console.error("Failed to revoke API key:", err);
    }
  };

  return (
    <DashboardShell>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#f0f4fa]">Settings</h1>
          <p className="mt-0.5 text-sm text-[rgba(240,244,250,0.45)]">Manage API keys and integrations</p>
        </div>

        {/* New key banner */}
        {showNewKey && (
          <div className="mb-6 rounded-xl border border-[#14b8a6]/30 bg-[#14b8a6]/10 p-5">
            <p className="mb-3 text-sm text-[#f0f4fa]">Your new API key — copy it now, you won't see it again:</p>
            <div className="mb-4 rounded-lg border border-white/[0.08] bg-[#05080f] p-4 font-mono text-sm break-all text-[#14b8a6]">
              {showNewKey}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { navigator.clipboard.writeText(showNewKey); }}
                className="btn-primary text-sm"
              >
                Copy to Clipboard
              </button>
              <button onClick={() => setShowNewKey(null)} className="btn-secondary text-sm">Done</button>
            </div>
          </div>
        )}

        {/* API Keys Section */}
        <div className="mb-6 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
          <h2 className="mb-5 text-sm font-semibold text-[#f0f4fa]">API Keys</h2>

          <form onSubmit={handleCreateKey} className="mb-5 flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. Production API)"
              className="flex-1 rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
            />
            <button
              type="submit"
              disabled={loading || !newKeyName}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create Key"}
            </button>
          </form>

          <div className="space-y-3">
            {apiKeys.length === 0 ? (
              <p className="text-sm text-[rgba(240,244,250,0.4)]">No API keys yet.</p>
            ) : apiKeys.map((key: any) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#05080f] px-5 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[#f0f4fa]">{key.name}</p>
                  <p className="mt-0.5 text-xs text-[rgba(240,244,250,0.35)]">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeKey(key.id)}
                  className="rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 px-3 py-1.5 text-xs text-[#f97316] transition hover:bg-[#f97316]/25"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Widget embed */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
          <h2 className="mb-3 text-sm font-semibold text-[#f0f4fa]">Embedded Widget</h2>
          <p className="mb-4 text-sm text-[rgba(240,244,250,0.45)]">Add this script tag to any website to embed the MyOrbisVoice widget:</p>
          <div className="overflow-auto rounded-xl border border-white/[0.07] bg-[#05080f] p-4 font-mono text-sm text-[#14b8a6]">
            {`<script src="https://app.myorbisvoice.com/widget.js"`}<br />
            {`  data-agent-id="YOUR_AGENT_ID"`}<br />
            {`  data-api-key="YOUR_API_KEY"></script>`}
          </div>
          <p className="mt-3 text-xs text-[rgba(240,244,250,0.35)]">
            Replace YOUR_AGENT_ID and YOUR_API_KEY with your values. Add <code className="text-[#14b8a6]">data-position="bottom-left"</code> to change widget position.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
