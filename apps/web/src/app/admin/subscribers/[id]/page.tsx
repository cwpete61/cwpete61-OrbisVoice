"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import DashboardShell from "../../../components/DashboardShell";
import PasswordInput from "../../../components/PasswordInput";
import { useTokenFromUrl } from "../../../../hooks/useTokenFromUrl";
import { API_BASE, SubscriberDetail, TwilioConfig, TenantGoogleConfig, authHeader } from "@/lib/api";

function SubscriberDetailContent({ id }: { id: string }) {
    const tokenLoaded = useTokenFromUrl();
    const [sub, setSub] = useState<SubscriberDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [liftingHold, setLiftingHold] = useState<string | null>(null);
    const [tab, setTab] = useState<"overview" | "users" | "agents" | "settings" | "api-keys">("overview");

    // Settings State
    const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>({ accountSid: "", authToken: "", phoneNumber: "", hasConfig: false });
    const [tenantGoogleConfig, setTenantGoogleConfig] = useState<TenantGoogleConfig>({ clientId: "", clientSecret: "", geminiApiKey: "", hasConfig: false });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // API Keys State
    const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string; createdAt: string }[]>([]);
    const [keysLoading, setKeysLoading] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [creatingKey, setCreatingKey] = useState(false);

    const fetchOverview = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/subscribers/${id}/overview`, { headers: authHeader() });
            const data = await res.json();
            if (data.ok) setSub(data.data);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchSettings = useCallback(async () => {
        setSettingsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/subscribers/${id}/settings`, { headers: authHeader() });
            const data = await res.json();
            if (data.ok) {
                setTwilioConfig(data.data.twilio || { accountSid: "", authToken: "", phoneNumber: "", hasConfig: false });
                setTenantGoogleConfig(data.data.google || { clientId: "", clientSecret: "", geminiApiKey: "", hasConfig: false });
            }
        } finally {
            setSettingsLoading(false);
        }
    }, [id]);

    const fetchApiKeys = useCallback(async () => {
        setKeysLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/subscribers/${id}/api-keys`, { headers: authHeader() });
            const data = await res.json();
            if (data.ok) setApiKeys(data.data);
        } finally {
            setKeysLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (tokenLoaded) {
            fetchOverview();
        }
    }, [tokenLoaded, fetchOverview]);

    useEffect(() => {
        if (tab === "settings" && tokenLoaded) {
            fetchSettings();
        }
    }, [tab, tokenLoaded, fetchSettings]);

    useEffect(() => {
        if (tab === "api-keys" && tokenLoaded) {
            fetchApiKeys();
        }
    }, [tab, tokenLoaded, fetchApiKeys]);

    const saveTenantSettings = async (type: "twilio" | "google") => {
        setSettingsSaving(true);
        setSettingsMessage(null);
        const token = localStorage.getItem("token");
        const config = type === "twilio" ? twilioConfig : tenantGoogleConfig;

        try {
            const r = await fetch(`${API_BASE}/admin/subscribers/${id}/settings`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ type, config })
            });
            const d = await r.json();
            if (d.ok) {
                setSettingsMessage({ type: "success", text: `${type.charAt(0).toUpperCase() + type.slice(1)} settings saved.` });
            } else {
                setSettingsMessage({ type: "error", text: d.message || "Failed to save settings." });
            }
        } catch {
            setSettingsMessage({ type: "error", text: "Network error." });
        } finally {
            setSettingsSaving(false);
        }
    };

    const deleteTenantSettings = async (type: "twilio" | "google") => {
        if (!confirm(`Are you sure you want to remove the ${type} configuration for this tenant?`)) return;
        await fetch(`${API_BASE}/admin/subscribers/${id}/settings/${type}`, {
            method: "DELETE",
            headers: authHeader()
        });
        // Refresh
        if (type === "twilio") setTwilioConfig({ accountSid: "", authToken: "", phoneNumber: "", hasConfig: false });
        else setTenantGoogleConfig({ clientId: "", clientSecret: "", geminiApiKey: "", hasConfig: false });
    };

    const createApiKey = async () => {
        if (!newKeyName.trim()) return;
        setCreatingKey(true);
        const r = await fetch(`${API_BASE}/admin/subscribers/${id}/api-keys`, {
            method: "POST",
            headers: {
                ...authHeader(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: newKeyName })
        });
        const d = await r.json();
        if (d.ok) {
            setApiKeys([d.data, ...apiKeys]);
            setNewKeyName("");
        }
        setCreatingKey(false);
    };

    const revokeApiKey = async (keyId: string) => {
        if (!confirm("Are you sure you want to revoke this API key?")) return;
        await fetch(`${API_BASE}/admin/subscribers/${id}/api-keys/${keyId}`, {
            method: "DELETE",
            headers: authHeader()
        });
        setApiKeys(apiKeys.filter(k => k.id !== keyId));
    };

    const liftHold = async (affiliateId: string) => {
        setLiftingHold(affiliateId);
        await fetch(`${API_BASE}/admin/affiliates/${affiliateId}/lift-hold`, {
            method: "POST",
            headers: authHeader(),
        });
        setLiftingHold(null);
        fetchOverview();
    };

    if (loading) {
        return (
            <DashboardShell tokenLoaded={tokenLoaded}>
                <div className="flex h-screen items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
                </div>
            </DashboardShell>
        );
    }

    if (!sub) {
        return (
            <DashboardShell tokenLoaded={tokenLoaded}>
                <div className="flex h-screen items-center justify-center text-sm text-[rgba(240,244,250,0.4)]">Subscriber not found</div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell tokenLoaded={tokenLoaded}>
            {/* Read-only admin banner */}
            <div className="flex items-center gap-2 bg-blue-500/10 border-b border-blue-500/20 px-6 py-2">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-blue-400"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                <p className="text-xs text-blue-300">
                    <span className="font-bold">Admin Management View</span> — You are managing {sub.name}&apos;s account settings.
                </p>
            </div>

            <div className="px-6 lg:px-8 py-8 max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <a href="/admin/tenants" className="text-xs text-[rgba(240,244,250,0.4)] hover:text-white transition">← Subscribers</a>
                        </div>
                        <h1 className="text-2xl font-bold text-[#f0f4fa]">{sub.name}</h1>
                        <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">
                            {sub.subscriptionTier?.toUpperCase()} · {sub.subscriptionStatus ?? "—"} ·
                            {sub.usageCount ?? 0}/{sub.usageLimit ?? "∞"} conversations
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${sub.subscriptionStatus === "active" ? "border-green-500/20 bg-green-500/10 text-green-400"
                            : sub.subscriptionStatus === "past_due" ? "border-red-500/20 bg-red-500/10 text-red-400"
                                : "border-white/10 bg-white/5 text-[rgba(240,244,250,0.5)]"
                            }`}>
                            ● {sub.subscriptionStatus ?? "No Plan"}
                        </span>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-4 mb-8">
                    {[
                        { label: "Total Users", value: sub.users?.length ?? 0 },
                        { label: "Agents", value: sub.agents?.length ?? 0 },
                        { label: "Conversations", value: sub.usageCount ?? 0 },
                        { label: "Credit Balance", value: sub.creditBalance ?? 0 },
                    ].map((s) => (
                        <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#0c111d] p-5 text-center">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">{s.label}</p>
                            <p className="mt-2 text-2xl font-bold text-[#f0f4fa]">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="mb-6 flex overflow-x-auto gap-0.5 border-b border-white/[0.06]">
                    {(["overview", "users", "agents", "settings", "api-keys"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 py-2.5 text-sm font-medium capitalize transition whitespace-nowrap border-b-2 ${tab === t ? "border-[#14b8a6] text-[#14b8a6]" : "border-transparent text-[rgba(240,244,250,0.5)] hover:text-white"}`}>
                            {t.replace("-", " ")}
                        </button>
                    ))}
                </div>

                {/* Overview */}
                {tab === "overview" && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 grid gap-3 sm:grid-cols-2 text-sm">
                            {[
                                ["Tenant ID", sub.id],
                                ["Billing Email", sub.billingEmail ?? sub.users?.[0]?.email ?? "—"],
                                ["Plan", sub.subscriptionTier ?? "free"],
                                ["Stripe Customer", sub.stripeCustomerId ?? "—"],
                                ["Stripe Subscription", sub.stripeSubscriptionId ?? "—"],
                                ["Subscription Ends", sub.subscriptionEnds ? new Date(sub.subscriptionEnds).toLocaleDateString() : "—"],
                                ["Usage Reset", sub.usageResetAt ? new Date(sub.usageResetAt).toLocaleDateString() : "—"],
                                ["Joined", new Date(sub.createdAt).toLocaleDateString()],
                            ].map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
                                    <span className="text-xs text-[rgba(240,244,250,0.4)]">{k}</span>
                                    <span className="text-xs font-mono text-[#f0f4fa] truncate max-w-[60%] text-right">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Users */}
                {tab === "users" && (
                    <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.05] text-left">
                                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">Name</th>
                                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">Email</th>
                                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">Role</th>
                                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {sub.users.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.01]">
                                        <td className="px-5 py-3">
                                            <div className="font-medium text-[#f0f4fa]">{u.name}</div>
                                            <div className="text-xs text-[rgba(240,244,250,0.6)] mt-0.5">{u.email}</div>
                                        </td>
                                        <td className="px-5 py-3 text-left">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${u.role === "SYSTEM_ADMIN" ? "bg-red-500/15 text-red-400"
                                                : u.isAdmin ? "bg-orange-500/15 text-orange-400"
                                                    : "bg-white/5 text-[rgba(240,244,250,0.5)]"
                                                }`}>{u.role}</span>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-[rgba(240,244,250,0.4)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Agents */}
                {tab === "agents" && (
                    <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.05] text-left">
                                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">Agent Name</th>
                                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">Voice</th>
                                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">Conversations</th>
                                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">Leads</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {sub.agents.map((a) => (
                                    <tr key={a.id} className="hover:bg-white/[0.01]">
                                        <td className="px-5 py-3 font-medium text-[#f0f4fa]">{a.name}</td>
                                        <td className="px-5 py-3 text-[rgba(240,244,250,0.6)] font-mono text-xs">{a.voiceId ?? "—"}</td>
                                        <td className="px-5 py-3 text-[#f0f4fa]">{a._count.transcripts}</td>
                                        <td className="px-5 py-3 text-[#f0f4fa]">{a._count.leads}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Settings Tab */}
                {tab === "settings" && (
                    <div className="space-y-6">
                        {settingsMessage && (
                            <div className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between ${settingsMessage.type === "success" ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`}>
                                <span>{settingsMessage.text}</span>
                                <button onClick={() => setSettingsMessage(null)} className="text-xs opacity-50 hover:opacity-100 italic">Dismiss</button>
                            </div>
                        )}

                        {/* Twilio Section */}
                        <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-sm font-semibold text-[#f0f4fa]">Twilio Configuration</h2>
                                    <p className="text-xs text-[rgba(240,244,250,0.45)] mt-1">Configure SMS and voice capabilities for this workspace</p>
                                </div>
                                {twilioConfig.hasConfig && (
                                    <button onClick={() => deleteTenantSettings("twilio")} className="text-[10px] font-bold uppercase tracking-wider text-red-400/70 hover:text-red-400 transition">Remove Config</button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[rgba(240,244,250,0.6)] mb-1.5">Account SID</label>
                                    <input type="text" value={twilioConfig.accountSid} onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2 text-sm text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition" placeholder="AC..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[rgba(240,244,250,0.6)] mb-1.5">Auth Token</label>
                                    <PasswordInput value={twilioConfig.authToken} onChange={(e: any) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2 text-sm text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition" placeholder="Twilio Auth Token" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[rgba(240,244,250,0.6)] mb-1.5">Phone Number</label>
                                    <input type="text" value={twilioConfig.phoneNumber} onChange={(e) => setTwilioConfig({ ...twilioConfig, phoneNumber: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2 text-sm text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition" placeholder="+1234..." />
                                </div>
                                <button onClick={() => saveTenantSettings("twilio")} disabled={settingsSaving} className="btn-primary w-full py-2 text-xs">
                                    {settingsSaving ? "Saving..." : "Update Twilio Config"}
                                </button>
                            </div>
                        </div>

                        {/* Google/Gemini Section */}
                        <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-sm font-semibold text-[#f0f4fa]">Google Cloud & Gemini</h2>
                                    <p className="text-xs text-[rgba(240,244,250,0.45)] mt-1">Tenant-specific OAuth and AI credentials</p>
                                </div>
                                {tenantGoogleConfig.hasConfig && (
                                    <button onClick={() => deleteTenantSettings("google")} className="text-[10px] font-bold uppercase tracking-wider text-red-400/70 hover:text-red-400 transition">Remove Config</button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[rgba(240,244,250,0.6)] mb-1.5">Google Client ID</label>
                                    <input type="text" value={tenantGoogleConfig.clientId} onChange={(e) => setTenantGoogleConfig({ ...tenantGoogleConfig, clientId: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2 text-sm text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition" placeholder="Client ID" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[rgba(240,244,250,0.6)] mb-1.5">Google Client Secret</label>
                                    <PasswordInput value={tenantGoogleConfig.clientSecret} onChange={(e: any) => setTenantGoogleConfig({ ...tenantGoogleConfig, clientSecret: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2 text-sm text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition" placeholder="Client Secret" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[rgba(240,244,250,0.6)] mb-1.5">Gemini API Key</label>
                                    <PasswordInput value={tenantGoogleConfig.geminiApiKey} onChange={(e: any) => setTenantGoogleConfig({ ...tenantGoogleConfig, geminiApiKey: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2 text-sm text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition" placeholder="Gemini Key" />
                                </div>
                                <button onClick={() => saveTenantSettings("google")} disabled={settingsSaving} className="btn-primary w-full py-2 text-xs">
                                    {settingsSaving ? "Saving..." : "Update Google Config"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* API Keys Tab */}
                {tab === "api-keys" && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                            <h2 className="text-sm font-semibold text-[#f0f4fa] mb-4">Create New API Key</h2>
                            <div className="flex gap-2">
                                <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="Enter a name for the key..."
                                    className="flex-1 rounded-lg border border-white/[0.08] bg-[#05080f] px-4 py-2 text-sm text-[#f0f4fa] outline-none focus:border-[#14b8a6]/50 transition" />
                                <button onClick={createApiKey} disabled={creatingKey || !newKeyName.trim()} className="btn-primary px-6 text-xs whitespace-nowrap">
                                    {creatingKey ? "Creating..." : "Generate Key"}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/[0.05] text-left">
                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">Name</th>
                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">Key</th>
                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">Created</th>
                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)] text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {keysLoading ? (
                                        <tr><td colSpan={4} className="px-5 py-12 text-center text-[rgba(240,244,250,0.4)]">Loading keys...</td></tr>
                                    ) : apiKeys.length === 0 ? (
                                        <tr><td colSpan={4} className="px-5 py-12 text-center text-[rgba(240,244,250,0.4)]">No API keys found for this tenant.</td></tr>
                                    ) : apiKeys.map((k) => (
                                        <tr key={k.id} className="hover:bg-white/[0.01]">
                                            <td className="px-5 py-4 font-medium text-[#f0f4fa]">{k.name}</td>
                                            <td className="px-5 py-4 font-mono text-xs text-[#14b8a6]">
                                                {k.key.substring(0, 6)}...{k.key.substring(k.key.length - 4)}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-[rgba(240,244,250,0.4)]">{new Date(k.createdAt).toLocaleDateString()}</td>
                                            <td className="px-5 py-4 text-right">
                                                <button onClick={() => revokeApiKey(k.id)} className="text-xs text-red-400/70 hover:text-red-400 transition underline underline-offset-4">Revoke</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Admin Actions */}
                <div className="mt-8 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                    <h3 className="mb-4 text-sm font-semibold text-[#f0f4fa]">⚡ Admin Actions</h3>
                    <div className="flex flex-wrap gap-3">
                        <a href={`/admin/tenants`}
                            className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-[rgba(240,244,250,0.6)] hover:text-white transition">
                            ← Back to Subscribers
                        </a>
                        {sub.users.some((u) => u.affiliate?.payoutHeld) && (
                            <button onClick={() => sub.users.forEach((u) => u.affiliate?.payoutHeld && liftHold(u.affiliate.id))}
                                disabled={!!liftingHold}
                                className="rounded-lg bg-orange-500/20 border border-orange-500/30 px-4 py-2 text-xs font-semibold text-orange-300 hover:bg-orange-500/30 transition">
                                {liftingHold ? "Lifting hold…" : "🔓 Lift Payout Hold"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}

export default function AdminSubscriberDetailPage({ params }: { params: { id: string } }) {
    return <Suspense><SubscriberDetailContent id={params.id} /></Suspense>;
}
