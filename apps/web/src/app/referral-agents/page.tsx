"use client";

import { Suspense, useEffect, useState } from "react";
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

function ReferralAgentsContent() {
    const [profile, setProfile] = useState<any>(null);
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

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
        transactionFeePercent: 3.4,
    });

    const [saveSettingsLoading, setSaveSettingsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [stripeStatus, setStripeStatus] = useState<any>(null);
    const [stripeLoading, setStripeLoading] = useState(false);

    const isAdmin = profile?.role === "ADMIN" || profile?.isAdmin || profile?.username === "Oadmin";

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchAffiliates(debouncedSearch);
            fetchPlatformSettings();
        }
    }, [isAdmin]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        if (isAdmin) {
            fetchAffiliates(debouncedSearch);
        }
    }, [debouncedSearch]);

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

    const fetchStripeStatus = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/stripe/status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStripeStatus(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch Stripe status:", err);
        }
    };

    useEffect(() => {
        if (profile) {
            fetchStripeStatus();
        }
    }, [profile]);

    const handleStripeOnboard = async () => {
        setStripeLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/stripe/onboard`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (res.ok && data.data?.url) {
                window.location.href = data.data.url;
            } else {
                alert(data.message || "Failed to generate onboarding link.");
            }
        } catch (err) {
            console.error("Failed to start Stripe onboarding:", err);
            alert("Network error.");
        } finally {
            setStripeLoading(false);
        }
    };

    const fetchAffiliates = async (searchTerm: string = "") => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const params = new URLSearchParams();
            params.set("filter", "referrers");
            if (searchTerm) {
                params.set("search", searchTerm);
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/affiliates?${params.toString()}`, {
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
                    transactionFeePercent: data.data.transactionFeePercent !== undefined ? data.data.transactionFeePercent : 3.4,
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
                <div className="px-8 py-10">
                    <h1 className="text-2xl font-bold text-[#f0f4fa] mb-6">Partner Portal</h1>

                    {searchParams.get("stripe_return") === "true" && (
                        <div className="mb-6 rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 px-4 py-3 text-sm text-[#10b981]">
                            Welcome back from Stripe! Your account status is updating.
                        </div>
                    )}
                    {searchParams.get("stripe_refresh") === "true" && (
                        <div className="mb-6 rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 px-4 py-3 text-sm text-[#f97316]">
                            Your Stripe connection session expired. Please try again.
                        </div>
                    )}

                    <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 mb-8">
                        <h2 className="text-lg font-semibold text-[#f0f4fa] mb-4">Payout Method</h2>

                        {stripeStatus?.status === 'active' ? (
                            <div className="flex items-center gap-3 text-sm text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 p-4 rounded-xl">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981]/20">✓</div>
                                <div>
                                    <p className="font-semibold">Stripe Connected</p>
                                    <p className="text-xs text-[rgba(16,185,129,0.7)]">ID: {stripeStatus.accountId}</p>
                                </div>
                            </div>
                        ) : stripeStatus?.status === 'pending' ? (
                            <div className="flex flex-col gap-4 bg-[#f97316]/5 border border-[#f97316]/20 p-5 rounded-xl">
                                <div className="flex items-center gap-3 text-sm text-[#f97316]">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f97316]/20 py-2">⏳</div>
                                    <div>
                                        <p className="font-semibold">Verification Pending</p>
                                        <p className="text-xs text-[rgba(249,115,22,0.7)]">Your Stripe account is created but missing details.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleStripeOnboard}
                                    disabled={stripeLoading}
                                    className="rounded-lg bg-[#f97316] px-4 py-2 text-sm font-medium text-white hover:bg-[#ea580c] transition w-fit disabled:opacity-50"
                                >
                                    {stripeLoading ? "Loading..." : "Resume Onboarding"}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/[0.05] p-5 rounded-xl">
                                <div>
                                    <p className="text-sm font-medium text-[#f0f4fa]">Set up automatic payouts</p>
                                    <p className="text-xs text-[rgba(240,244,250,0.5)] mt-1">Connect your bank account securely via Stripe to receive your earnings automatically.</p>
                                </div>
                                <button
                                    onClick={handleStripeOnboard}
                                    disabled={stripeLoading}
                                    className="rounded-lg bg-[#635BFF] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5851E5] transition w-fit disabled:opacity-50 shadow-md shadow-[#635BFF]/20"
                                >
                                    {stripeLoading ? "Connecting..." : "Connect with Stripe"}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5 text-center">
                            <p className="text-xs text-[rgba(240,244,250,0.5)]">Your Referrals will be shown here when we build the dashboard.</p>
                        </div>
                    </div>
                </div>
            </DashboardShell>
        );
    }


    return (
        <DashboardShell>
            <div className="px-8 py-10">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-[#f0f4fa]">Referral Agents Management</h1>
                    <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Manage referrers, payouts, and analytics.</p>
                </div>

                <div className="mb-8 flex space-x-1 rounded-xl bg-white/[0.02] p-1">
                    {[
                        { id: "affiliates", label: "Referral Agent Roster" },
                        { id: "overview", label: "Overview / Analytics" },
                        { id: "settings", label: "Controls & Management" },
                    ].map((tab: any) => (
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
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-[#f0f4fa]">Referral Agent Roster</h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search name, email, slug..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-64 rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-1.5 text-xs text-[#f0f4fa] placeholder:text-[rgba(240,244,250,0.3)] focus:border-[#14b8a6]/50 focus:outline-none transition"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="absolute right-2 top-1.5 text-[rgba(240,244,250,0.4)] hover:text-[#f0f4fa]"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#111827] text-xs font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Stripe / Tax</th>
                                        <th className="px-6 py-4">Balance</th>
                                        <th className="px-6 py-4 text-right">Last Paid</th>
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
                                                    <p className="text-xs text-[rgba(240,244,250,0.4)]">{aff.user?.email}</p>
                                                    <div className="text-[10px] text-[#14b8a6]">slug: {aff.slug}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {aff.user?.isAffiliate ? (
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className="text-[10px] font-bold text-[#14b8a6] uppercase tracking-wider">Professional Partner</span>
                                                            <a
                                                                href="/affiliate-agents?tab=affiliates"
                                                                className="text-[10px] text-[#14b8a6] hover:underline transition-colors"
                                                            >
                                                                Manage Partner →
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-[rgba(240,244,250,0.4)] uppercase tracking-wider">Referrer</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <div title={`Stripe: ${aff.stripeAccountStatus || 'Not Connected'}`} className={`h-2 w-2 rounded-full ${aff.stripeAccountStatus === 'active' ? 'bg-[#10b981]' : aff.stripeAccountStatus ? 'bg-[#f43f5e]' : 'bg-white/10'}`}></div>
                                                        <div title={`Tax Form: ${aff.taxFormCompleted ? 'Completed' : 'Missing'}`} className={`h-2 w-2 rounded-full ${aff.taxFormCompleted ? 'bg-[#10b981]' : 'bg-[#f97316]'}`}></div>
                                                    </div>
                                                    <div className="mt-1 text-[10px] text-[rgba(240,244,250,0.4)] font-medium">
                                                        {aff.status}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-[#f0f4fa]">${aff.balance?.toFixed(2)}</div>
                                                    <div className="text-[10px] text-[rgba(240,244,250,0.4)]">Total: ${aff.totalPaid?.toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-[#f0f4fa] text-right">
                                                    <div className="text-xs font-medium">
                                                        {aff.lastPayoutAt ? new Date(aff.lastPayoutAt).toLocaleDateString() : "-"}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={5} className="py-12 text-center text-[rgba(240,244,250,0.3)]">No referral agents found.</td></tr>
                                    )}
                                </tbody>
                            </table>
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
                                <label className="text-xs font-medium text-[rgba(240,244,250,0.6)]">Transaction Fee (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={settingsForm.transactionFeePercent}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, transactionFeePercent: parseFloat(e.target.value) || 0 })}
                                        className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2.5 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-[#f0f4fa]/30">%</span>
                                </div>
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
                                                fetchAffiliates();
                                            } else {
                                                const d = await res.json();
                                                alert(d.message);
                                            }
                                        } catch (e) {
                                            // Handle error or ignore
                                        }
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

export default function ReferralAgentsPage() {
    return (
        <Suspense>
            <ReferralAgentsContent />
        </Suspense>
    );
}
