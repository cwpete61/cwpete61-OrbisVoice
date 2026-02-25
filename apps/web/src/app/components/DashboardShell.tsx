"use client";
import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProfileMenu from "./ProfileMenu";
import UserInfoCard from "./UserInfoCard";
import IdleTimeoutModal from "./IdleTimeoutModal";
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

const NotificationFlyout = ({
  notifs,
  unreadCount,
  onClose,
  onMarkAllRead,
  onMarkRead
}: {
  notifs: any[];
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}) => {
  return (
    <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-md shadow-lg z-50">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Notifications ({unreadCount})</h3>
        <button onClick={onMarkAllRead} className="text-blue-400 text-sm hover:underline">
          Mark all as read
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifs.length === 0 ? (
          <p className="p-4 text-gray-400 text-center">No new notifications.</p>
        ) : (
          notifs.map((notif: any) => {
            const typeInfo = TYPE_LABELS[notif.type] || { label: "Unknown", color: "text-gray-400", emoji: "❓" };
            return (
              <div
                key={notif.id}
                className={`p-4 border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${!notif.read ? "bg-gray-700" : ""
                  }`}
                onClick={() => onMarkRead(notif.id)}
              >
                <div className="flex items-start">
                  <span className="text-xl mr-2">{typeInfo.emoji}</span>
                  <div className="flex-grow">
                    <p className={`font-semibold ${typeInfo.color}`}>{typeInfo.label}</p>
                    <p className="text-gray-300 text-sm">{notif.message}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0"></span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="p-2 border-t border-gray-700 text-center">
        <Link href="/notifications" className="text-blue-400 text-sm hover:underline">
          View All Notifications
        </Link>
      </div>
    </div>
  );
};

const NAV = [
  {
    category: "Main",
    href: "/dashboard",
    label: "Agents",
    isAffiliateHidden: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    category: "Main",
    href: "/billing",
    label: "Your Subscriptions",
    isAffiliateHidden: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    category: "Main",
    href: "/admin/packages",
    label: "Conversation Packs",
    isAdminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v14m0-14l-8 4m0 0v10l8 4" />
      </svg>
    ),
  },
  {
    category: "Main",
    href: "/stats",
    label: "Analytics",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 3v18h18M7 16l4-5 4 4 4-6" />
      </svg>
    ),
  },
  {
    category: "Partnership",
    href: "/referrals",
    label: "My Referrals",
    isAffiliateHidden: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 100-8 4 4 0 000 8zm6-2a3 3 0 100-6 3 3 0 000 6zm-12 0a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    ),
  },
  {
    category: "Partnership",
    href: "/affiliates",
    label: "My Affiliate Partnership",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },

  // Admin Category
  {
    category: "Admin",
    href: "/admin",
    label: "Command Center",
    isAdminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    category: "Admin",
    href: "/admin/tenants",
    label: "Workspaces",
    isAdminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
      </svg>
    ),
  },
  {
    category: "Admin",
    href: "/admin/users",
    label: "All Users",
    isAdminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    category: "Admin",
    href: "/admin/affiliate-agents",
    label: "Affiliate Professional",
    isAdminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 4.318l-1.318 1.318a4.5 4.5 0 000 6.364L12 13.318l1.318-1.318a4.5 4.5 0 000-6.364L12 4.318z" />
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
      </svg>
    ),
  },
  {
    category: "Admin",
    href: "/admin/payouts",
    label: "Partner Payouts",
    isAdminOnly: true,
    isSystemAdminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },

  {
    category: "Admin",
    href: "/admin/system",
    label: "System Health",
    isAdminOnly: true,
    isSystemAdminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    category: "Admin",
    href: "/admin/audit",
    label: "Audit Logs",
    isAdminOnly: true,
    isSystemAdminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    category: "System",
    href: "/help",
    label: "Help Center",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
      </svg>
    ),
  },
  {
    category: "System",
    href: "/settings",
    label: "Settings",
    isAffiliateHidden: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function DashboardShell({ children, tokenLoaded = true }: { children: React.ReactNode; tokenLoaded?: boolean }) {
  const path = usePathname();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tokenLoaded) {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
      }
      fetchProfile();
      fetchUnreadCount();
    }
  }, [tokenLoaded, router]);

  // Close flyout when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    }
    if (showNotifs) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifs]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/users/me`, {
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

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/notifications?limit=1&unreadOnly=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifs(data.data?.unreadCount ?? 0);
      }
    } catch { }
  };

  const fetchNotifsFlyout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/notifications?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.data?.notifications ?? []);
      }
    } catch { }
  };

  const toggleNotifs = () => {
    if (!showNotifs) {
      fetchNotifsFlyout();
      setUnreadNotifs(0);
      const token = localStorage.getItem("token");
      fetch(`${API_BASE}/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ all: true }),
      });
    }
    setShowNotifs(!showNotifs);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-[#05080f] text-[#f0f4fa]">
      <style>{`
        @keyframes navGlowPulse {
          0%, 100% { box-shadow: 0 0 5px rgba(20, 184, 166, 0.2); background-color: rgba(20, 184, 166, 0.1); }
          50% { box-shadow: 0 0 20px rgba(20, 184, 166, 0.6); background-color: rgba(20, 184, 166, 0.25); }
        }
        .nav-active-glow {
          animation: navGlowPulse 2.5s infinite ease-in-out;
          color: #14b8a6;
        }
      `}</style>

      {/* Sidebar */}
      <aside className="flex w-fit min-w-[200px] flex-col border-r border-white/[0.06] bg-[#080c16]">
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-[calc(1.25rem+10px)]">
          <div className="h-7 w-7 rounded-md bg-[#14b8a6]" />
          <span className="text-sm font-bold tracking-tight">MyOrbisVoice</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {["Main", "Partnership", "Admin", "System"].map((cat) => {
            const items = NAV.filter((item: any) => {
              if (item.category !== cat) return false;

              const isSystemAdmin = profile?.role === "SYSTEM_ADMIN";
              const isAffiliateOnly = profile?.isAffiliate && !profile?.isAdmin;

              if (item.isSystemAdminOnly && !isSystemAdmin) return false;
              if (item.isAdminOnly && !profile?.isAdmin) return false;
              if (item.isAffiliateHidden && isAffiliateOnly) return false;

              if (item.label === "My Affiliate Partnership") {
                return profile?.isAdmin || profile?.isAffiliate;
              }
              return true;
            });

            if (items.length === 0) return null;

            return (
              <div key={cat} className="space-y-1">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-[rgba(240,244,250,0.25)]">
                  {cat}
                </h3>
                {items.map((item) => {
                  const exactMatchOnly = ['/', '/admin', '/dashboard', '/settings'];
                  const active = exactMatchOnly.includes(item.href)
                    ? path === item.href
                    : path === item.href || (path.startsWith(item.href + '/') && item.href !== '/');

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition duration-300 ${active
                        ? "nav-active-glow"
                        : "text-[rgba(240,244,250,0.5)] hover:bg-white/[0.04] hover:text-[#f0f4fa]"
                        } ${(item.label === "Affiliate Professional" || item.label === "Partner Payouts") && !active
                          ? "!text-yellow-400/90"
                          : ""
                        }`}
                    >
                      <span className={`${active ? "text-[#14b8a6]" : "text-[rgba(240,244,250,0.35)]"}`}>
                        {item.icon}
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/[0.06] px-3 py-2">
          <UserInfoCard onProfileClick={() => setShowProfileMenu(true)} tokenLoaded={tokenLoaded} />
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2.5 w-full text-xs text-[rgba(240,244,250,0.4)] hover:text-[rgba(240,244,250,0.7)] hover:bg-white/[0.02] transition"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar with bell */}
        <div className="flex items-center justify-end px-6 py-3 border-b border-white/[0.05] bg-[#080c16]">
          <div className="relative" ref={notifRef}>
            <button onClick={toggleNotifs} className="relative p-2 rounded-lg hover:bg-white/[0.05] transition group focus:outline-none">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={`transition ${showNotifs ? "text-white" : "text-[rgba(240,244,250,0.5)] group-hover:text-white"}`}>
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-[#080c16]"></span>
              )}
            </button>

            {/* Google-style Flyout */}
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-white/[0.1] bg-[#1a1f2e] shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#232838]">
                  <h3 className="font-semibold text-[#f0f4fa] text-sm">Notifications</h3>
                  <Link onClick={() => setShowNotifs(false)} href="/settings?tab=notifications" className="text-[rgba(240,244,250,0.5)] hover:text-white transition p-1 rounded-md hover:bg-white/[0.05]">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                  </Link>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <p className="text-sm text-[rgba(240,244,250,0.5)]">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {notifs.map((n: any) => {
                        const meta = TYPE_LABELS[n.type] ?? { label: n.type, color: "text-white", emoji: "📬" };
                        return (
                          <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-[#282d3e] transition text-left group">
                            <div className="text-xl mt-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition">{meta.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#f0f4fa] leading-tight mb-0.5">{n.title}</p>
                              <p className="text-xs text-[rgba(240,244,250,0.6)] line-clamp-2 leading-relaxed">{n.body}</p>
                              <p className="text-[10px] text-[rgba(240,244,250,0.3)] mt-1.5">
                                {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="border-t border-white/[0.06] bg-[#232838] p-2 text-center">
                  <Link onClick={() => setShowNotifs(false)} href="/notifications" className="text-xs font-medium text-[#14b8a6] hover:text-[#2dd4bf] transition block p-2 rounded hover:bg-white/[0.05]">
                    See all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Profile Menu Modal */}
      {showProfileMenu && (
        <ProfileMenu onClose={() => setShowProfileMenu(false)} />
      )}

      {/* Idle Timeout Modal */}
      <IdleTimeoutModal isAdmin={profile?.isAdmin} />
    </div>
  );
}