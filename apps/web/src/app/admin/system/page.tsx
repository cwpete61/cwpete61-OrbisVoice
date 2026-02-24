"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/DashboardShell";
import { API_BASE } from "@/lib/api";

export default function SystemSettings() {
    const [settings, setSettings] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const [settingsRes, statsRes] = await Promise.all([
                fetch(`${API_BASE}/admin/settings`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE}/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            ]);

            const settingsData = await settingsRes.json();
            const statsData = await statsRes.json();

            if (settingsRes.ok && statsRes.ok) {
                setSettings(settingsData.data);
                setStats(statsData.data);
            } else {
                setError("Failed to load system data");
            }
        } catch (err) {
            setError("Failed to connect to API");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/admin/settings`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setMessage("Settings updated successfully");
            } else {
                const data = await res.json();
                setError(data.message || "Failed to update settings");
            }
        } catch (err) {
            setError("Failed to connect to API");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardShell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell>
            <div className="p-8 max-w-none mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-[#f0f4fa]">System Configuration</h1>
                    <p className="mt-2 text-[rgba(240,244,250,0.5)]">Manage global platform settings and monitor infrastructure health</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Settings Form */}
                    <div className="lg:col-span-2 space-y-8">
                        <form onSubmit={handleSave} className="rounded-2xl border border-white/[0.06] bg-[#0c111d] p-8 shadow-xl">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Platform Limits & Commissions
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Plan Limits */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.4)]">LTD Plan Limit</label>
                                    <input
                                        type="number"
                                        value={settings.ltdLimit}
                                        onChange={(e) => setSettings({ ...settings, ltdLimit: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6] focus:outline-none focus:ring-1 focus:ring-[#14b8a6] transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Starter Plan Limit</label>
                                    <input
                                        type="number"
                                        value={settings.starterLimit}
                                        onChange={(e) => setSettings({ ...settings, starterLimit: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6] focus:outline-none focus:ring-1 focus:ring-[#14b8a6] transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Professional Plan Limit</label>
                                    <input
                                        type="number"
                                        value={settings.professionalLimit}
                                        onChange={(e) => setSettings({ ...settings, professionalLimit: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6] focus:outline-none focus:ring-1 focus:ring-[#14b8a6] transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Enterprise Plan Limit</label>
                                    <input
                                        type="number"
                                        value={settings.enterpriseLimit}
                                        onChange={(e) => setSettings({ ...settings, enterpriseLimit: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6] focus:outline-none focus:ring-1 focus:ring-[#14b8a6] transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.4)]">AI Infra Plan Limit</label>
                                    <input
                                        type="number"
                                        value={settings.aiInfraLimit}
                                        onChange={(e) => setSettings({ ...settings, aiInfraLimit: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6] focus:outline-none focus:ring-1 focus:ring-[#14b8a6] transition"
                                    />
                                </div>

                                {/* Commissions */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Low Commission (%)</label>
                                    <input
                                        type="number"
                                        value={settings.lowCommission}
                                        onChange={(e) => setSettings({ ...settings, lowCommission: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6] focus:outline-none focus:ring-1 focus:ring-[#14b8a6] transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.4)]">High Commission (%)</label>
                                    <input
                                        type="number"
                                        value={settings.highCommission}
                                        onChange={(e) => setSettings({ ...settings, highCommission: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6] focus:outline-none focus:ring-1 focus:ring-[#14b8a6] transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Min. Payout ($)</label>
                                    <input
                                        type="number"
                                        value={settings.payoutMinimum}
                                        onChange={(e) => setSettings({ ...settings, payoutMinimum: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6] focus:outline-none focus:ring-1 focus:ring-[#14b8a6] transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Refund Hold (Days)</label>
                                    <input
                                        type="number"
                                        value={settings.refundHoldDays}
                                        onChange={(e) => setSettings({ ...settings, refundHoldDays: e.target.value })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6] focus:outline-none focus:ring-1 focus:ring-[#14b8a6] transition"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-8">
                                <div className="flex flex-col">
                                    {error && <p className="text-sm text-red-500">{error}</p>}
                                    {message && <p className="text-sm text-emerald-500">{message}</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-[#14b8a6] px-6 py-2.5 text-sm font-bold text-[#05080f] hover:bg-[#0ea5e9] transition disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Infrastructure Health */}
                    <div className="space-y-8">
                        <div className="rounded-2xl border border-white/[0.06] bg-[#0c111d] p-6 shadow-xl">
                            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Infrastructure Status
                            </h2>
                            <div className="space-y-6">
                                <HealthIndicator label="Core API" status={stats?.systemHealth?.api} description="Edge runtime & handlers" />
                                <HealthIndicator label="Database" status={stats?.systemHealth?.database} description="PostgreSQL persistence layer" />
                                <HealthIndicator label="Redis Cache" status={stats?.systemHealth?.redis} description="Session & Rate limit engine" />
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/[0.06]">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[rgba(240,244,250,0.4)] mb-4">Version Info</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-[rgba(240,244,250,0.4)]">API Version</span>
                                        <span className="font-mono text-[#14b8a6]">v1.4.3-stable</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[rgba(240,244,250,0.4)]">Client Bundle</span>
                                        <span className="font-mono text-[#14b8a6]">v1.4.3 (2026-02-23)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/[0.06] bg-[#0c111d] p-6 shadow-xl">
                            <h2 className="text-lg font-semibold mb-4 text-amber-500">Danger Zone</h2>
                            <p className="text-xs text-[rgba(240,244,250,0.4)] mb-6">Sensitive platform-wide administrative actions.</p>
                            <button className="w-full rounded-lg border border-red-500/30 bg-red-500/5 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition">
                                Put Platform in Maintenance Mode
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}

function HealthIndicator({ label, status, description }: any) {
    const isOk = status === "operational";
    return (
        <div className="group">
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[#f0f4fa]">{label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isOk ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {status || 'Unknown'}
                </span>
            </div>
            <p className="text-[10px] text-[rgba(240,244,250,0.3)]">{description}</p>
        </div>
    );
}
