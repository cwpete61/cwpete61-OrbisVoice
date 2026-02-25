"use client";

import { Suspense, useEffect, useState } from "react";
import DashboardShell from "../../../components/DashboardShell";
import { useTokenFromUrl } from "../../../../hooks/useTokenFromUrl";
import { API_BASE } from "@/lib/api";

function SubscriberDetailContent({ id }: { id: string }) {
    const tokenLoaded = useTokenFromUrl();
    const [sub, setSub] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [liftingHold, setLiftingHold] = useState<string | null>(null);
    const [tab, setTab] = useState<"overview" | "users" | "agents">("overview");

    useEffect(() => {
        if (!tokenLoaded) return;
        const token = localStorage.getItem("token");
        fetch(`${API_BASE}/admin/subscribers/${id}/overview`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => { setSub(d.data); setLoading(false); });
    }, [tokenLoaded, id]);

    const liftHold = async (affiliateId: string) => {
        setLiftingHold(affiliateId);
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/admin/affiliates/${affiliateId}/lift-hold`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        setLiftingHold(null);
        // Refresh
        const r = await fetch(`${API_BASE}/admin/subscribers/${id}/overview`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        setSub(d.data);
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
                    <span className="font-bold">Admin Read-Only View</span> — You are viewing {sub.name}'s account. Changes must be made via admin actions below.
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
                <div className="mb-6 flex gap-0.5 border-b border-white/[0.06]">
                    {(["overview", "users", "agents"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 py-2.5 text-sm font-medium capitalize transition border-b-2 ${tab === t ? "border-[#14b8a6] text-[#14b8a6]" : "border-transparent text-[rgba(240,244,250,0.5)] hover:text-white"}`}>
                            {t}
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
                                {(sub.users ?? []).map((u: any) => (
                                    <tr key={u.id} className="hover:bg-white/[0.01]">
                                        <td className="px-5 py-3">
                                            <div className="font-medium text-[#f0f4fa]">{u.name}</div>
                                            <div className="text-xs text-[rgba(240,244,250,0.6)] mt-0.5">{u.email}</div>
                                        </td>
                                        <td className="px-5 py-3">
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
                                {(sub.agents ?? []).map((a: any) => (
                                    <tr key={a.id} className="hover:bg-white/[0.01]">
                                        <td className="px-5 py-3 font-medium text-[#f0f4fa]">{a.name}</td>
                                        <td className="px-5 py-3 text-[rgba(240,244,250,0.6)] font-mono text-xs">{a.voiceId ?? "—"}</td>
                                        <td className="px-5 py-3 text-[#f0f4fa]">{a._count?.transcripts ?? 0}</td>
                                        <td className="px-5 py-3 text-[#f0f4fa]">{a._count?.leads ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                        {sub.users?.some((u: any) => u.affiliate?.payoutHeld) && (
                            <button onClick={() => sub.users.forEach((u: any) => u.affiliate?.payoutHeld && liftHold(u.affiliate.id))}
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
