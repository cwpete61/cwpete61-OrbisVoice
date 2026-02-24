"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";
import { API_BASE } from "@/lib/api";

const TYPE_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
    COMMISSION_EARNED: { label: "Commission", color: "text-[#14b8a6]", emoji: "💰" },
    PAYOUT_PROCESSED: { label: "Payout", color: "text-green-400", emoji: "✅" },
    PAYOUT_SCHEDULED: { label: "Payout", color: "text-blue-400", emoji: "📆" },
    TAX_HOLD_TRIGGERED: { label: "Tax Hold", color: "text-orange-400", emoji: "⚠️" },
    TAX_HOLD_LIFTED: { label: "Hold Lifted", color: "text-green-400", emoji: "🟢" },
    LEAD_CAPTURED: { label: "Lead", color: "text-purple-400", emoji: "🎯" },
    REFERRAL_CONVERTED: { label: "Referral", color: "text-[#14b8a6]", emoji: "🎉" },
    USAGE_WARNING: { label: "Usage", color: "text-yellow-400", emoji: "⚡" },
    SUBSCRIPTION_EXPIRING: { label: "Subscription", color: "text-orange-400", emoji: "🔔" },
    SYSTEM_ANNOUNCEMENT: { label: "Announcement", color: "text-blue-400", emoji: "📢" },
    ADMIN_MANUAL: { label: "Admin", color: "text-white", emoji: "👤" },
};

function NotificationsContent() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const tokenLoaded = useTokenFromUrl();

    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        setLoading(true);
        const res = await fetch(`${API_BASE}/notifications?limit=50&unreadOnly=${filter === "unread"}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setNotifications(data.data?.notifications ?? []);
            setUnreadCount(data.data?.unreadCount ?? 0);
        }
        setLoading(false);
    }, [filter]);

    useEffect(() => { if (tokenLoaded) fetchNotifications(); }, [tokenLoaded, fetchNotifications]);

    const markAllRead = async () => {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/notifications/mark-read`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ all: true }),
        });
        fetchNotifications();
    };

    const markRead = async (id: string) => {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/notifications/mark-read`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ids: [id] }),
        });
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
    };

    return (
        <DashboardShell tokenLoaded={tokenLoaded}>
            <div className="px-6 lg:px-8 py-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#f0f4fa]">Notifications</h1>
                        <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">
                            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex rounded-lg border border-white/[0.08] overflow-hidden">
                            {(["all", "unread"] as const).map((f) => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`px-4 py-2 text-sm font-medium transition ${filter === f ? "bg-[#14b8a6] text-[#05080f]" : "text-[rgba(240,244,250,0.5)] hover:text-white"
                                        }`}>
                                    {f === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
                                </button>
                            ))}
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead}
                                className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-[rgba(240,244,250,0.6)] hover:text-white hover:bg-white/[0.05] transition">
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>

                {/* Notification list */}
                <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="text-4xl mb-3">🔔</div>
                            <p className="text-sm font-medium text-[#f0f4fa]">No notifications yet</p>
                            <p className="text-xs text-[rgba(240,244,250,0.4)] mt-1">You'll see activity here as it happens</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.04]">
                            {notifications.map((n: any) => {
                                const meta = TYPE_LABELS[n.type] ?? { label: n.type, color: "text-white", emoji: "📬" };
                                return (
                                    <button key={n.id} onClick={() => !n.read && markRead(n.id)}
                                        className={`w-full text-left flex items-start gap-4 px-6 py-5 transition hover:bg-white/[0.02] ${!n.read ? "bg-[#14b8a6]/[0.03]" : ""}`}>
                                        <div className="text-2xl mt-0.5 shrink-0">{meta.emoji}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                                                {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />}
                                            </div>
                                            <p className="text-sm font-semibold text-[#f0f4fa]">{n.title}</p>
                                            <p className="text-xs text-[rgba(240,244,250,0.5)] mt-0.5 leading-relaxed">{n.body}</p>
                                        </div>
                                        <time className="text-[10px] text-[rgba(240,244,250,0.3)] whitespace-nowrap shrink-0 mt-1">
                                            {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </time>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}

export default function NotificationsPage() {
    return <Suspense><NotificationsContent /></Suspense>;
}
