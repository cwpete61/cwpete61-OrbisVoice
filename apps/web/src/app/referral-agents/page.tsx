"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "../components/DashboardShell";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

export default function ReferralAgentsPage() {
    const [profile, setProfile] = useState<any>(null);
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "affiliates";

    const [platformSettings, setPlatformSettings] = useState<any>(null);
    const [settingsForm, setSettingsForm] = useState({
        defaultCommissionLevel: "LOW",
        commissionDurationMonths: 0,
        payoutMinimum: 100,
        refundHoldDays: 14,
        payoutCycleDelayMonths: 1,
    });
    const [saveSettingsLoading, setSaveSettingsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const isAdmin = profile?.role === "ADMIN" || profile?.isAdmin || profile?.username === "Oadmin";

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchAffiliates();
            fetchPlatformSettings();
        }
    }, [isAdmin]);

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
            console.error("Failed to fetch profile");
        }
    };

    const fetchAffiliates = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/affiliates`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAffiliates(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch affiliates");
        } finally {
            setLoading(false);
        }
    };

    const fetchPlatformSettings = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setPlatformSettings(data.data);
                setSettingsForm({
                    defaultCommissionLevel: data.data.defaultCommissionLevel || "LOW",
                    commissionDurationMonths: data.data.commissionDurationMonths || 0,
                    payoutMinimum: data.data.payoutMinimum || 100,
                    refundHoldDays: data.data.refundHoldDays || 14,
                    payoutCycleDelayMonths: data.data.payoutCycleDelayMonths !== undefined ? data.data.payoutCycleDelayMonths : 1,
                });
            }
        } catch (err) {
            console.error("Failed to fetch settings");
        }
    };

    const handleSaveSettings = async () => {
        setSaveSettingsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...platformSettings,
                    ...settingsForm
                }),
            });
            if (res.ok) {
                // saved
            }
        } catch (err) {
            console.error("Failed to save settings");
        } finally {
            setSaveSettingsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        setActionLoading(id);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/affiliates/${id}/status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            if (res.ok) fetchAffiliates();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleProcessPayout = async (id: string) => {
        if (!confirm("Are you sure you want to mark this payout as complete?")) return;
        setActionLoading(id);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/affiliates/${id}/payout`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchAffiliates();
            } else {
                const d = await res.json();
                alert(d.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    // Mock chart data (in production, we'd calculate this from individual transactions)
    const chartData = [
        { name: "Mon", Clicks: 400, Conversions: 24, Revenue: 2400 },
        { name: "Tue", Clicks: 300, Conversions: 13, Revenue: 1398 },
        { name: "Wed", Clicks: 200, Conversions: 98, Revenue: 9800 },
        { name: "Thu", Clicks: 278, Conversions: 39, Revenue: 3908 },
        { name: "Fri", Clicks: 189, Conversions: 48, Revenue: 4800 },
        { name: "Sat", Clicks: 239, Conversions: 38, Revenue: 3800 },
        { name: "Sun", Clicks: 349, Conversions: 43, Revenue: 4300 },
    ];

    if (profile && !isAdmin) {
        return (
            <DashboardShell>
                <div className="flex h-screen items-center justify-center">
                    <p className="text-sm text-[rgba(240,244,250,0.4)]">Access restricted. Admins only.</p>
                </div>
            </DashboardShell>
        );
    }

    const payouts = affiliates.filter(a => a.balance >= (settingsForm.payoutMinimum || 100));

    return (
        <DashboardShell>
            <div className="mx-auto max-w-6xl px-8 py-10">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-[#f0f4fa]">Referral Agents Management</h1>
                    <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Manage affiliates, payouts, and analytics.</p>
                </div>

                <div className="mb-8 flex space-x-1 rounded-xl bg-white/[0.02] p-1">
                    {[
                        { id: "affiliates", label: "Affiliate List" },
                        { id: "payouts", label: "Payouts Queue", badge: payouts.length },
                        { id: "overview", label: "Overview / Analytics" },
                        { id: "settings", label: "Controls & Management" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => router.push(`?tab=${tab.id}`)}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${activeTab === tab.id
                                ? "bg-[#14b8a6]/10 text-[#14b8a6] shadow-sm"
                                : "text-[rgba(240,244,250,0.5)] hover:bg-white/[0.05] hover:text-[#f0f4fa]"
                                }`}
                        >
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="flex h-5 items-center justify-center w-5 rounded-full bg-[#14b8a6] text-[10px] text-white">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === "overview" && (
                    <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                        <h2 className="text-sm font-semibold text-[#f0f4fa] mb-6">Traffic & Revenue Ecosystem</h2>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                                    <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#f0f4fa' }}
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="Clicks" stroke="#8884d8" activeDot={{ r: 8 }} />
                                    <Line yAxisId="left" type="monotone" dataKey="Conversions" stroke="#82ca9d" />
                                    <Line yAxisId="right" type="monotone" dataKey="Revenue" stroke="#f97316" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === "affiliates" && (
                    <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                        <h2 className="mb-5 text-sm font-semibold text-[#f0f4fa]">Affiliate Roster</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#111827] text-xs font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Balance</th>
                                        <th className="px-6 py-4">Total Paid</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {loading ? (
                                        <tr><td colSpan={5} className="py-12 text-center text-[rgba(240,244,250,0.3)]">Loading...</td></tr>
                                    ) : affiliates.length > 0 ? (
                                        affiliates.map((aff) => (
                                            <tr key={aff.id} className="hover:bg-white/[0.02]">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-[#f0f4fa]">{aff.user?.name}</div>
                                                    <div className="text-xs text-[#14b8a6]">slug: {aff.slug}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${aff.status === "ACTIVE" ? "bg-green-500/10 text-green-400" :
                                                        aff.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400" :
                                                            "bg-red-500/10 text-red-400"
                                                        }`}>
                                                        {aff.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[#f0f4fa]">${aff.balance?.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-[#f0f4fa]">${aff.totalPaid?.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    {aff.status === "PENDING" && (
                                                        <button
                                                            disabled={actionLoading === aff.id}
                                                            onClick={() => handleUpdateStatus(aff.id, "ACTIVE")}
                                                            className="text-green-500 hover:underline text-xs"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    {aff.status === "ACTIVE" && (
                                                        <button
                                                            disabled={actionLoading === aff.id}
                                                            onClick={() => handleUpdateStatus(aff.id, "REJECTED")}
                                                            className="text-red-500 hover:underline text-xs"
                                                        >
                                                            Revoke
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={5} className="py-12 text-center text-[rgba(240,244,250,0.3)]">No affiliates found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "payouts" && (
                    <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                        <div className="mb-5 flex justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-[#f0f4fa]">Payout Queue</h2>
                                <p className="mt-1 text-xs text-[rgba(240,244,250,0.5)]">Partners above the ${settingsForm.payoutMinimum} threshold.</p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {payouts.length > 0 ? payouts.map(a => (
                                <div key={a.id} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#111827] p-5">
                                    <div>
                                        <h3 className="font-semibold text-[#f0f4fa]">{a.user?.name} <span className="text-xs font-normal text-[rgba(240,244,250,0.5)]">({a.user?.email})</span></h3>
                                        <p className="mt-1 text-sm text-[#10b981] font-mono">Available Balance: ${a.balance.toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleProcessPayout(a.id)}
                                        disabled={actionLoading === a.id}
                                        className="rounded-lg bg-[#14b8a6] px-4 py-2 text-sm font-medium text-[#05080f] hover:bg-[#0d9488] disabled:opacity-50"
                                    >
                                        Mark as Paid
                                    </button>
                                </div>
                            )) : (
                                <div className="rounded-xl border border-dashed border-white/[0.1] py-12 text-center text-[rgba(240,244,250,0.5)]">
                                    No partners currently eligible for payout.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                        <div className="mb-6 flex justify-between">
                            <h2 className="text-sm font-semibold text-[#f0f4fa]">Global Commission Parameters</h2>
                            <button
                                onClick={handleSaveSettings}
                                disabled={saveSettingsLoading}
                                className="rounded-lg border border-[#14b8a6]/40 bg-[#14b8a6]/10 px-4 py-2 text-xs font-medium text-[#14b8a6] hover:bg-[#14b8a6]/20 transition disabled:opacity-50"
                            >
                                {saveSettingsLoading ? "Saving..." : "Save Settings"}
                            </button>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[rgba(240,244,250,0.6)]">Payout Minimum Threshold</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-sm text-[#f0f4fa]/50">$</span>
                                    <input
                                        type="number"
                                        value={settingsForm.payoutMinimum}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, payoutMinimum: parseFloat(e.target.value) || 0 })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] pl-8 pr-3 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[rgba(240,244,250,0.6)]">Payout Delay Cycles (Months)</label>
                                <input
                                    type="number"
                                    value={settingsForm.payoutCycleDelayMonths}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, payoutCycleDelayMonths: parseInt(e.target.value) || 0 })}
                                    className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[rgba(240,244,250,0.6)]">Refund Hold Period (Days)</label>
                                <input
                                    type="number"
                                    value={settingsForm.refundHoldDays}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, refundHoldDays: parseInt(e.target.value) || 0 })}
                                    className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[rgba(240,244,250,0.6)]">Lifetime / Term (0 = Infinite)</label>
                                <input
                                    type="number"
                                    value={settingsForm.commissionDurationMonths}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, commissionDurationMonths: parseInt(e.target.value) || 0 })}
                                    className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none"
                                    placeholder="0 for Lifetime"
                                />
                            </div>
                        </div>

                        <div className="mt-10 border-t border-white/[0.05] pt-6">
                            <h2 className="text-sm font-semibold text-[#f0f4fa] mb-4">Manual Partner Override</h2>
                            <div className="flex gap-3 max-w-md">
                                <input
                                    type="text"
                                    placeholder="Enter User ID..."
                                    className="flex-1 rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none"
                                    id="overrideUserId"
                                />
                                <button
                                    onClick={async () => {
                                        const input = document.getElementById("overrideUserId") as HTMLInputElement;
                                        const val = input?.value;
                                        if (!val) return;
                                        setActionLoading("override");
                                        try {
                                            const token = localStorage.getItem("token");
                                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/affiliates/promote`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                                body: JSON.stringify({ userId: val }),
                                            });
                                            if (res.ok) {
                                                alert("User successfully promoted to affiliate!");
                                                input.value = "";
                                                // @ts-ignore
                                                fetchAffiliates();
                                            } else {
                                                const d = await res.json();
                                                alert(d.message);
                                            }
                                        } catch (e) { }
                                        setActionLoading(null);
                                    }}
                                    disabled={actionLoading === "override"}
                                    className="rounded-lg bg-[#14b8a6] px-4 py-2.5 text-sm font-medium text-[#05080f] hover:bg-[#0d9488] disabled:opacity-50"
                                >
                                    Promote
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-[rgba(240,244,250,0.4)]">Instantly converts a standard user into an active partner without an application.</p>
                        </div>
                    </div>
                )}

            </div>
        </DashboardShell>
    );
}
