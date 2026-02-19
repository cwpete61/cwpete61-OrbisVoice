"use client";

import { useState, useEffect } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("api");
  const [profile, setProfile] = useState<any>(null);
  const [googleConfig, setGoogleConfig] = useState<any>({
    clientId: "",
    clientSecret: "",
    redirectUri: "",
    enabled: false,
  });
  const [googleSaving, setGoogleSaving] = useState(false);
  const [googleSaveSuccess, setGoogleSaveSuccess] = useState(false);
  const [googleTesting, setGoogleTesting] = useState(false);
  const [googleTestResult, setGoogleTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tokenEmail, setTokenEmail] = useState<string | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarConnectUrl, setCalendarConnectUrl] = useState<string | null>(null);
  const tokenLoaded = useTokenFromUrl();

  const isAdmin =
    profile?.role === "ADMIN" ||
    profile?.isAdmin ||
    profile?.username === "Oadmin" ||
    profile?.email === "admin@orbisvoice.app" ||
    tokenEmail === "admin@orbisvoice.app";

  useEffect(() => {
    fetchApiKeys();
    fetchProfile();
    checkCalendarConnection();
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        setTokenEmail(payload?.email || null);
      } catch {
        setTokenEmail(null);
      }
    }
  }, [tokenLoaded]);


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

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const fetchGoogleConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/google-auth/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleConfig({
          clientId: data.data.clientId || "",
          clientSecret: data.data.clientSecret || "",
          redirectUri: data.data.redirectUri || "",
          enabled: !!data.data.enabled,
        });
      }
    } catch (err) {
      console.error("Failed to fetch Google config:", err);
    }
  };

  const saveGoogleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleSaving(true);
    setGoogleTestResult(null);
    setGoogleSaveSuccess(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/google-auth/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(googleConfig),
      });
      if (res.ok) {
        await fetchGoogleConfig();
        setGoogleSaveSuccess(true);
        setTimeout(() => setGoogleSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save Google config:", err);
    } finally {
      setGoogleSaving(false);
    }
  };

  const testGoogleConnection = async () => {
    setGoogleTesting(true);
    setGoogleTestResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/url`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.data?.url) {
          setGoogleTestResult({
            success: true,
            message: "Configuration is valid! Google OAuth URL generated successfully.",
          });
        } else {
          setGoogleTestResult({
            success: false,
            message: "Configuration returned invalid response.",
          });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setGoogleTestResult({
          success: false,
          message: errorData.message || `Error: ${res.status} ${res.statusText}`,
        });
      }
    } catch (err: any) {
      setGoogleTestResult({
        success: false,
        message: `Connection failed: ${err.message || "Unknown error"}`,
      });
    } finally {
      setGoogleTesting(false);
    }
  };

  const checkCalendarConnection = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/calendar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarConnected(!!data.data?.connected);
      }
    } catch (err) {
      console.error("Failed to check calendar connection:", err);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      setCalendarLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/calendar-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.url) {
          setCalendarConnectUrl(data.data.url);
          // Redirect to Google OAuth for calendar access
          window.location.href = data.data.url;
        }
      }
    } catch (err) {
      console.error("Failed to get calendar connect URL:", err);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm("Are you sure you want to disconnect your calendar?")) return;
    
    try {
      setCalendarLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/calendar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setCalendarConnected(false);
      }
    } catch (err) {
      console.error("Failed to disconnect calendar:", err);
    } finally {
      setCalendarLoading(false);
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

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("api")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "api"
                ? "bg-[#14b8a6]/15 text-[#14b8a6]"
                : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
            }`}
          >
            API Keys
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setActiveTab("google");
                  fetchGoogleConfig();
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === "google"
                    ? "bg-[#14b8a6]/15 text-[#14b8a6]"
                    : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
                }`}
              >
                Google Config
              </button>
            </>
          )}
          <button
            onClick={() => {
              setActiveTab("calendar");
              checkCalendarConnection();
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "calendar"
                ? "bg-[#14b8a6]/15 text-[#14b8a6]"
                : "text-[rgba(240,244,250,0.55)] hover:bg-white/[0.05]"
            }`}
          >
            Calendar
          </button>
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
        {activeTab === "api" && (
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
        )}

        {/* Google Config Section */}
        {activeTab === "google" && isAdmin && (
          <div className="mb-6 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-2 text-sm font-semibold text-[#f0f4fa]">Google Auth Configuration</h2>
            <p className="mb-5 text-sm text-[rgba(240,244,250,0.45)]">
              Configure Google OAuth for sign-in only. These values are used by the auth service.
            </p>

            <form onSubmit={saveGoogleConfig} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Client ID</label>
                <input
                  type="text"
                  value={googleConfig.clientId}
                  onChange={(e) => {
                    setGoogleConfig({ ...googleConfig, clientId: e.target.value });
                    setGoogleSaveSuccess(false);
                  }}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                  placeholder="GOOGLE_CLIENT_ID"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Client Secret</label>
                <input
                  type="password"
                  value={googleConfig.clientSecret}
                  onChange={(e) => {
                    setGoogleConfig({ ...googleConfig, clientSecret: e.target.value });
                    setGoogleSaveSuccess(false);
                  }}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                  placeholder="GOOGLE_CLIENT_SECRET"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[rgba(240,244,250,0.6)]">Redirect URI</label>
                <input
                  type="text"
                  value={googleConfig.redirectUri}
                  onChange={(e) => {
                    setGoogleConfig({ ...googleConfig, redirectUri: e.target.value });
                    setGoogleSaveSuccess(false);
                  }}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2.5 text-sm text-[#f0f4fa] placeholder-[rgba(240,244,250,0.25)] outline-none focus:border-[#14b8a6]/60 focus:ring-1 focus:ring-[#14b8a6]/30 transition"
                  placeholder="https://app.yourdomain.com/auth/google/callback"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-[rgba(240,244,250,0.65)]">
                <input
                  type="checkbox"
                  checked={googleConfig.enabled}
                  onChange={(e) => {
                    setGoogleConfig({ ...googleConfig, enabled: e.target.checked });
                    setGoogleSaveSuccess(false);
                  }}
                  className="h-4 w-4 rounded border-white/[0.2] bg-[#05080f]"
                />
                Enable Google Auth
              </label>

              {googleSaveSuccess && (
                <div className="rounded-lg border border-[#14b8a6]/30 bg-[#14b8a6]/10 px-4 py-3 text-sm text-[#14b8a6]">
                  ✓ Configuration saved successfully!
                </div>
              )}

              {googleTestResult && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    googleTestResult.success
                      ? "border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]"
                      : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]"
                  }`}
                >
                  {googleTestResult.message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={googleSaving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {googleSaving ? "Saving…" : "Save Configuration"}
                </button>
                <button
                  type="button"
                  onClick={testGoogleConnection}
                  disabled={googleTesting}
                  className="rounded-lg border border-white/[0.12] bg-white/[0.03] px-4 py-2 text-sm text-[rgba(240,244,250,0.75)] transition hover:border-white/[0.25] hover:bg-white/[0.05] disabled:opacity-50"
                >
                  {googleTesting ? "Testing…" : "Test Connection"}
                </button>
              </div>
            </form>
          </div>
        )}


        {/* Widget embed */}
        {activeTab === "calendar" && (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <h2 className="mb-2 text-sm font-semibold text-[#f0f4fa]">Calendar Connection</h2>
            <p className="mb-6 text-sm text-[rgba(240,244,250,0.45)]">
              Connect your Google Calendar to allow Voice Automation to check availability and book appointments automatically.
            </p>

            <div className="rounded-xl border border-white/[0.07] bg-[#05080f] p-5">
              {calendarConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-[#14b8a6]" />
                    <span className="text-sm text-[rgba(240,244,250,0.75)]">Calendar is connected</span>
                  </div>
                  <button
                    onClick={handleDisconnectCalendar}
                    disabled={calendarLoading}
                    className="w-full rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-2.5 text-sm font-medium text-[#ef4444] transition hover:border-[#ef4444]/50 hover:bg-[#ef4444]/15 disabled:opacity-50"
                  >
                    {calendarLoading ? "Disconnecting…" : "Disconnect Calendar"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[rgba(240,244,250,0.55)]">
                    No calendar connected yet. Click the button below to authorize access to your Google Calendar.
                  </p>
                  <button
                    onClick={handleConnectCalendar}
                    disabled={calendarLoading}
                    className="w-full btn-primary text-sm disabled:opacity-50"
                  >
                    {calendarLoading ? "Connecting…" : "Connect Google Calendar"}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#05080f] p-4">
              <p className="text-xs font-medium text-[rgba(240,244,250,0.55)] mb-2">What this enables:</p>
              <ul className="space-y-2 text-xs text-[rgba(240,244,250,0.45)]">
                <li className="flex items-start gap-2">
                  <span className="text-[#14b8a6] mt-1">✓</span>
                  <span>Voice AI checks your calendar availability before booking appointments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#14b8a6] mt-1">✓</span>
                  <span>Automatically adds confirmed appointments to your calendar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#14b8a6] mt-1">✓</span>
                  <span>Prevents double-booking by checking real-time availability</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Widget embed */}
        {activeTab === "api" && (
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
        )}
      </div>
    </DashboardShell>
  );
}
