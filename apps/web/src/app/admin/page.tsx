"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { API_BASE } from "@/lib/api";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setStats(data.data);
            } else {
                setError(data.message || "Failed to load admin stats");
            }
        } catch (err) {
            setError("Failed to connect to API");
        } finally {
            setLoading(false);
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

    const chartData = stats?.subscriptionBreakdown?.map((s: any) => ({
        name: (s.subscriptionTier || 'free').charAt(0).toUpperCase() + (s.subscriptionTier || 'free').slice(1),
        count: s._count
    })) || [];

    const COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b'];

    return (
        <DashboardShell>
            <div className="p-8">
                <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6]">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-[#f0f4fa]">Platform Command Center</h1>
                        </div>
                        <p className="text-[rgba(240,244,250,0.5)]">High-level overview of OrbisVoice platform performance</p>
                    </div>
                    <button
                        onClick={fetchStats}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-sm text-[rgba(240,244,250,0.7)] hover:bg-white/[0.05] transition"
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Data
                    </button>
                </header>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-500 flex items-center gap-3">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Overview Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Tenants"
                        value={stats?.totalTenants || 0}
                        icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 21h18M3 7v14M21 7v14M12 3L3 7v14M12 3l9 4M12 3v18" /></svg>}
                    />
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zm12 14v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>}
                    />
                    <StatCard
                        title="Total Agents"
                        value={stats?.totalAgents || 0}
                        icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>}
                    />
                    <StatCard
                        title="Estimated MRR"
                        value={`$${stats?.estimatedMRR || 0}`}
                        icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
                        isHighlight
                    />
                </div>

                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Subscription Breakdown Chart */}
                    <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-[#0c111d] p-6 shadow-xl">
                        <h2 className="mb-6 text-xl font-semibold flex items-center gap-2">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M3 3v18h18M7 16l4-5 4 4 4-6" />
                            </svg>
                            Subscription Breakdown
                        </h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="rgba(240,244,250,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="rgba(240,244,250,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        contentStyle={{ backgroundColor: '#0c111d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                        itemStyle={{ color: '#14b8a6', fontWeight: 'bold' }}
                                        labelStyle={{ color: 'rgba(240,244,250,0.5)', marginBottom: '4px' }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                        {chartData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* System Health */}
                    <div className="rounded-2xl border border-white/[0.06] bg-[#0c111d] p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <svg width="120" height="120" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5l10-5l-10-5zM2 17l10 5l10-5M2 12l10 5l10-5" /></svg>
                        </div>
                        <h2 className="mb-6 text-xl font-semibold flex items-center gap-2">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            System Health
                        </h2>
                        <div className="space-y-4">
                            <HealthItem label="API Node (Fastify)" status={stats?.systemHealth?.api} />
                            <HealthItem label="PostgreSQL Database" status={stats?.systemHealth?.database} />
                            <HealthItem label="Redis Cache Engine" status={stats?.systemHealth?.redis} />
                            <div className="mt-8 border-t border-white/[0.06] pt-5">
                                <div className="flex items-center justify-between text-xs text-[rgba(240,244,250,0.4)]">
                                    <span>Last Heartbeat</span>
                                    <span className="font-mono">{stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'N/A'}</span>
                                </div>
                            </div>
                            <button className="w-full mt-4 py-2 border border-white/[0.08] rounded-lg text-xs text-[rgba(240,244,250,0.5)] hover:bg-white/[0.03] transition">
                                View Full Logs
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="mt-8">
                    <h2 className="mb-6 text-xl font-semibold">Quick Management</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <QuickLinkCard
                            title="Manage Tenants"
                            subtitle="View and edit all platform workspaces"
                            href="/admin/tenants"
                            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-12h1m-1 4h1m-1 4h1" /></svg>}
                        />
                        <QuickLinkCard
                            title="User Directory"
                            subtitle="Manage user accounts and permissions"
                            href="/admin/users"
                            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                        />
                        <QuickLinkCard
                            title="System Settings"
                            subtitle="Global platform and pricing config"
                            href="/admin/system"
                            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        />
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}

function StatCard({ title, value, icon, isHighlight = false }: any) {
    return (
        <div className={`rounded-2xl border p-6 transition group relative overflow-hidden ${isHighlight
                ? 'border-[#14b8a6]/40 bg-[#14b8a6]/5 shadow-[0_0_20px_rgba(20,184,166,0.1)]'
                : 'border-white/[0.06] bg-[#0c111d] hover:border-[#14b8a6]/30'
            }`}>
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isHighlight ? 'bg-[#14b8a6] text-[#05080f]' : 'bg-white/[0.04] text-[rgba(240,244,250,0.6)] group-hover:bg-[#14b8a6]/20 group-hover:text-[#14b8a6]'} transition`}>
                    {icon}
                </div>
                <div className="h-1 w-6 rounded-full bg-white/[0.05]" />
            </div>
            <h3 className="text-sm font-medium text-[rgba(240,244,250,0.5)] relative z-10">{title}</h3>
            <p className={`mt-1 text-3xl font-bold relative z-10 ${isHighlight ? 'text-[#14b8a6]' : 'text-[#f0f4fa]'}`}>{value}</p>

            {isHighlight && (
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-[#14b8a6]/10 blur-2xl" />
            )}
        </div>
    );
}

function HealthItem({ label, status }: any) {
    const isOk = status === "operational";
    return (
        <div className="flex items-center justify-between py-2.5 group">
            <span className="text-sm text-[rgba(240,244,250,0.7)] group-hover:text-[#f0f4fa] transition">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isOk ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 border border-rose-300'}`} />
                <span className={`text-xs font-semibold tracking-wide ${isOk ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(status || 'Unknown').toUpperCase()}
                </span>
            </div>
        </div>
    );
}

function QuickLinkCard({ title, subtitle, href, icon }: any) {
    return (
        <a
            href={href}
            className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.06] bg-[#0c111d] hover:border-[#14b8a6]/40 hover:bg-[#14b8a6]/5 transition group"
        >
            <div className="h-10 w-10 rounded-xl bg-white/[0.04] group-hover:bg-[#14b8a6]/20 flex items-center justify-center text-[rgba(240,244,250,0.6)] group-hover:text-[#14b8a6] transition">
                {icon}
            </div>
            <div>
                <h4 className="font-semibold text-[#f0f4fa]">{title}</h4>
                <p className="text-xs text-[rgba(240,244,250,0.4)] group-hover:text-[rgba(240,244,250,0.6)] transition">{subtitle}</p>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition translate-x-2 group-hover:translate-x-0">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </a>
    );
}