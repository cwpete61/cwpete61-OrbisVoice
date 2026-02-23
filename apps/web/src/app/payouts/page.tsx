"use client";

import { Suspense, useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { API_BASE } from "@/lib/api";

function PayoutsContent() {
    const [profile, setProfile] = useState<any>(null);
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [settings, setSettings] = useState<any>(null);

    const isAdmin = profile?.role === "ADMIN" || profile?.isAdmin || profile?.username === "Oadmin";

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);

    useEffect(() => {
        fetchProfile();
        fetchPlatformSettings();
        fetchPayoutQueue();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/users/me`, {
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

    const fetchPlatformSettings = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/admin/platform-settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch settings");
        }
    };

    const fetchPayoutQueue = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/admin/payouts/queue`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setPayouts(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch payout queue");
        } finally {
            setLoading(false);
        }
    };

    const handleProcessBulkPayout = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to process ${selectedIds.length} payouts?`)) return;

        setActionLoading("bulk");
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/admin/payouts/bulk`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ affiliateIds: selectedIds }),
            });
            if (res.ok) {
                const result = await res.json();
                alert(result.message);
                setSelectedIds([]);
                fetchPayoutQueue();
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

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === payableItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(payableItems.map(p => p.id));
        }
    };

    if (profile && !isAdmin) {
        return (
            <DashboardShell>
                <div className="flex h-[80vh] items-center justify-center">
                    <p className="text-[rgba(240,244,250,0.5)]">You do not have permission to view this page.</p>
                </div>
            </DashboardShell>
        );
    }

    const payoutMinimum = settings?.payoutMinimum || 100;
    const payableItems = payouts.filter(p => !p.complianceBlocked && p.grossAmount >= payoutMinimum);

    return (
        <DashboardShell>
            <div className="px-8 py-10">
                <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#f0f4fa]">Payout Management</h1>
                        <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Process and track payouts for referral agents.</p>
                    </div>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleProcessBulkPayout}
                            disabled={actionLoading === "bulk"}
                            className="rounded-lg bg-[#14b8a6] px-6 py-2.5 text-sm font-bold text-[#05080f] hover:bg-[#0d9488] disabled:opacity-50 shadow-lg shadow-[#14b8a6]/20 transition-all active:scale-95"
                        >
                            {actionLoading === "bulk" ? "Processing..." : `Pay Selected (${selectedIds.length})`}
                        </button>
                    )}
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 shadow-xl">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-6">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-sm font-semibold text-[#f0f4fa]">Payout Queue</h2>
                                <p className="mt-1 text-xs text-[rgba(240,244,250,0.5)]">Partners eligible for payout (Min. ${payoutMinimum})</p>
                            </div>
                            {payableItems.length > 0 && (
                                <button
                                    onClick={toggleSelectAll}
                                    className="text-xs font-medium text-[#14b8a6] hover:text-[#0d9488] bg-[#14b8a6]/10 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    {selectedIds.length === payableItems.length ? "Deselect All" : "Select All Payable"}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={fetchPayoutQueue}
                            className="flex items-center gap-2 text-xs font-medium text-[rgba(240,244,250,0.5)] hover:text-[#f0f4fa] transition-colors"
                        >
                            <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh Queue
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            <div className="py-12 text-center">
                                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent mb-2"></div>
                                <div className="text-xs text-[rgba(240,244,250,0.3)]">Analyzing payout eligibility...</div>
                            </div>
                        ) : payouts.length > 0 ? payouts.map(a => {
                            const isSelected = selectedIds.includes(a.id);
                            const isPayable = !a.complianceBlocked && a.grossAmount >= payoutMinimum;

                            return (
                                <div
                                    key={a.id}
                                    className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${isSelected
                                        ? "border-[#14b8a6]/50 bg-[#14b8a6]/5"
                                        : "border-white/[0.05] bg-[#111827] hover:bg-[#111827]/80"
                                        }`}
                                >
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(a.id)}
                                            disabled={!isPayable}
                                            className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#14b8a6] focus:ring-[#14b8a6] focus:ring-offset-0 disabled:opacity-20 cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-[#f0f4fa] truncate">{a.user?.name}</h3>
                                            <div className="flex gap-2">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${a.stripeConnected ? 'bg-[#10b981]' : 'bg-[#f43f5e]'}`}></div>
                                                    <span className="text-[10px] text-[rgba(240,244,250,0.5)] font-medium">Stripe</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${a.taxFormCompleted ? 'bg-[#10b981]' : 'bg-[#f97316]'}`}></div>
                                                    <span className="text-[10px] text-[rgba(240,244,250,0.5)] font-medium">W9/1099</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-[rgba(240,244,250,0.5)] uppercase tracking-wider font-semibold">Net Payout:</span>
                                                <span className="text-sm font-bold text-[#10b981] font-mono">${a.netAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-[rgba(240,244,250,0.5)]">Gross:</span>
                                                <span className="text-xs font-medium text-[#f0f4fa] font-mono">${a.grossAmount.toFixed(2)}</span>
                                            </div>
                                            {a.lastPayoutAt && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-[rgba(240,244,250,0.5)]">Last Paid:</span>
                                                    <span className="text-xs font-medium text-[rgba(240,244,250,0.7)]">{new Date(a.lastPayoutAt).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {a.complianceBlocked && (
                                            <div className="mt-2 flex items-center gap-2 text-[10px] text-[#f97316] font-medium bg-[#f97316]/10 px-2 py-1 rounded w-fit">
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                Compliance Block: Tax form required (YTD {'>'} $600)
                                            </div>
                                        )}
                                    </div>

                                    <div className="hidden sm:block">
                                        <div className="text-right">
                                            <div className="text-[10px] text-[rgba(240,244,250,0.3)] uppercase tracking-wider font-bold mb-1">Cycle Availability</div>
                                            <div className="text-xs font-semibold text-[#f0f4fa]">
                                                {/* In a real app this might come from a specific date field, using current date for demo */}
                                                Available Now
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="rounded-xl border border-dashed border-white/[0.1] py-16 text-center">
                                <div className="text-3xl mb-3">💰</div>
                                <div className="text-sm font-medium text-[rgba(240,244,250,0.5)]">No pending payouts found.</div>
                                <div className="text-xs text-[rgba(240,244,250,0.3)] mt-1">Refresh the queue to check for new eligible partners.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}

export default function PayoutsPage() {
    return (
        <Suspense>
            <PayoutsContent />
        </Suspense>
    );
}