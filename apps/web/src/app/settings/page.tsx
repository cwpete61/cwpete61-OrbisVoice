"use client";

import { useState, useEffect } from "react";

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
    <div className="min-h-screen bg-gradient-to-br from-orbit-blue via-void to-slate">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-mist mb-8">Settings</h1>

        {/* API Keys Section */}
        <div className="bg-slate/20 border border-slate rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-signal-cyan mb-6">API Keys</h2>

          {showNewKey && (
            <div className="bg-aurora-green/20 border border-aurora-green rounded-lg p-4 mb-6">
              <p className="text-mist mb-2">Your new API key has been created. Copy it now - you won't see it again:</p>
              <div className="bg-orbit-blue p-3 rounded border border-aurora-green break-all font-mono text-sm text-signal-cyan">
                {showNewKey}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(showNewKey);
                  alert("Copied to clipboard!");
                }}
                className="mt-3 bg-aurora-green text-orbit-blue px-4 py-2 rounded font-semibold hover:bg-signal-cyan transition"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowNewKey(null)}
                className="mt-3 ml-2 bg-slate/50 text-mist px-4 py-2 rounded font-semibold hover:bg-slate/70 transition"
              >
                Done
              </button>
            </div>
          )}

          {/* Create New Key Form */}
          <form onSubmit={handleCreateKey} className="bg-orbit-blue/30 border border-slate rounded-lg p-4 mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g., 'Production API', 'Mobile App')"
                className="flex-1 bg-orbit-blue border border-slate px-4 py-2 rounded text-mist placeholder-slate focus:outline-none focus:border-signal-cyan"
              />
              <button
                type="submit"
                disabled={loading || !newKeyName}
                className="bg-signal-cyan text-orbit-blue px-6 py-2 rounded font-semibold hover:bg-aurora-green transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Key"}
              </button>
            </div>
          </form>

          {/* API Keys List */}
          <div className="space-y-3">
            {apiKeys.length === 0 ? (
              <p className="text-slate">No API keys yet</p>
            ) : (
              apiKeys.map((key: any) => (
                <div
                  key={key.id}
                  className="flex justify-between items-center bg-orbit-blue/50 border border-slate p-4 rounded"
                >
                  <div>
                    <p className="text-mist font-semibold">{key.name}</p>
                    <p className="text-slate text-sm">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="bg-plasma-orange/20 text-plasma-orange px-4 py-2 rounded text-sm hover:bg-plasma-orange/40 transition"
                  >
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget Embed Section */}
        <div className="bg-slate/20 border border-slate rounded-lg p-6">
          <h2 className="text-2xl font-bold text-signal-cyan mb-4">Embedded Widget</h2>
          <p className="text-slate mb-4">
            Add this script tag to any website to embed the OrbisVoice widget:
          </p>
          <div className="bg-orbit-blue p-4 rounded border border-slate overflow-auto">
            <code className="text-signal-cyan text-sm font-mono break-all">
              &lt;script src=&quot;https://app.orbisvoice.com/widget.js&quot;
              <br />
              data-agent-id=&quot;YOUR_AGENT_ID&quot;
              <br />
              data-api-key=&quot;YOUR_API_KEY&quot;&gt;&lt;/script&gt;
            </code>
          </div>
          <p className="text-slate text-sm mt-3">
            Replace YOUR_AGENT_ID and YOUR_API_KEY with your values. Optional: add
            `data-position="bottom-left"` to change widget position.
          </p>
        </div>
      </div>
    </div>
  );
}
