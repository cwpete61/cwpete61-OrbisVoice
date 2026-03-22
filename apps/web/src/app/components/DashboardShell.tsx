"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProfileMenu from "./ProfileMenu";
import UserInfoCard from "./UserInfoCard";
import IdleTimeoutModal from "./IdleTimeoutModal";
import { API_BASE, User, Notification } from "@/lib/api";

type NavItem = {
  label: string;
  href: string;
  category: string;
  icon?: React.ReactNode;
  isSystemAdminOnly?: boolean;
  isAdminOnly?: boolean;
  isAffiliateHidden?: boolean;
};

const shouldShowNavItem = (item: NavItem, profile: User | null | undefined): boolean => {
  const isSystemAdmin = profile?.role === "SYSTEM_ADMIN";
  const isAffiliateOnly =
    typeof profile?.isAffiliate === "boolean" ? profile.isAffiliate && !profile.isAdmin : false;

  if (item.isSystemAdminOnly && !isSystemAdmin) return false;
  if (item.isAdminOnly && !profile?.isAdmin) return false;
  if (item.isAffiliateHidden && isAffiliateOnly) return false;

  if (item.label === "My Affiliate Partnership") {
    return !!(profile?.isAdmin || profile?.isAffiliate);
  }
  return true;
};

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
  onMarkRead,
}: {
  notifs: Notification[];
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
          notifs.map((notif: Notification) => {
            const typeInfo = TYPE_LABELS[notif.type] || {
              label: "Unknown",
              color: "text-gray-400",
              emoji: "❓",
            };
            return (
              <div
                key={notif.id}
                className={`p-4 border-b border-gray-700 hover:bg-gray-700 cursor-pointer ${
                  !notif.read ? "bg-gray-700" : ""
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
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    category: "Main",
    href: "/billing",
    label: "Your Subscriptions",
    isAffiliateHidden: true,
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
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
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v14m0-14l-8 4m0 0v10l8 4" />
      </svg>
    ),
  },
  {
    category: "Main",
    href: "/stats",
    label: "Analytics",
    isAdminOnly: false, // Available to all users for their own stats
    isAffiliateHidden: true,
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
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
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 100-8 4 4 0 000 8zm6-2a3 3 0 100-6 3 3 0 000 6zm-12 0a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    ),
  },
  {
    category: "Partnership",
    href: "/affiliates",
    label: "My Affiliate Partnership",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
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
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
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
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
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
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
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
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
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
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    category: "Admin",
    href: "/admin/system",
    label: "Platform Settings",
    isAdminOnly: true,
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },

  {
    category: "Admin",
    href: "/admin/system-health",
    label: "System Health",
    isAdminOnly: true,
    isSystemAdminOnly: true,
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
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
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    category: "System",
    href: "/help",
    label: "Help Center",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
      </svg>
    ),
  },
  {
    category: "System",
    href: "/settings",
    label: "Settings",
    isAffiliateHidden: true,
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function DashboardShell({
  children,
  tokenLoaded = true,
  maxWidth = "max-w-7xl",
}: {
  children: React.ReactNode;
  tokenLoaded?: boolean;
  maxWidth?: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 404) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/notifications?unreadOnly=true&limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifs(data.data?.unreadCount ?? 0);
      }
    } catch {}
  }, []);

  const fetchNotifsFlyout = useCallback(async () => {
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
    } catch {}
  }, []);

  useEffect(() => {
    if (tokenLoaded) {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
      }
      setTimeout(() => {
        fetchProfile();
        fetchUnreadCount();
      }, 0);
    }
  }, [tokenLoaded, router, fetchProfile, fetchUnreadCount]);

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on path change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [path]);

  return (
    <div className="flex h-screen bg-[#05080f] text-[#f0f4fa] overflow-hidden">
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

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop static, Mobile slide-over */}
      <aside
        className={`fixed inset-y-0 left-0 z-[130] w-[260px] flex-col border-r border-white/[0.06] bg-[#080c16] transition-transform duration-300 ease-in-out lg:static lg:flex lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[#14b8a6]" />
            <span className="text-sm font-bold tracking-tight">MyOrbisVoice</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            suppressHydrationWarning
            className="lg:hidden text-[rgba(240,244,250,0.5)]"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {["Main", "Partnership", "Admin", "System"].map((cat) => {
            const items = (NAV as NavItem[]).filter(
              (item) => item.category === cat && shouldShowNavItem(item, profile)
            );

            if (items.length === 0) return null;

            return (
              <div key={cat} className="space-y-1">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-[rgba(240,244,250,0.25)]">
                  {cat}
                </h3>
                {items.map((item) => {
                  const exactMatchOnly = ["/", "/admin", "/dashboard", "/settings"];
                  const active = exactMatchOnly.includes(item.href)
                    ? path === item.href
                    : path === item.href || (path.startsWith(item.href + "/") && item.href !== "/");

                  return (
                    <Link
                      key={`${item.label}-${item.href}`}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-300 ${
                        active
                          ? "nav-active-glow"
                          : "text-[rgba(240,244,250,0.5)] hover:bg-white/[0.04] hover:text-[#f0f4fa]"
                      } ${
                        (item.label === "Affiliate Professional" ||
                          item.label === "Partner Payouts") &&
                        !active
                          ? "!text-yellow-400/90"
                          : ""
                      }`}
                    >
                      <span
                        className={`${active ? "text-[#14b8a6]" : "text-[rgba(240,244,250,0.35)]"}`}
                      >
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

        {/* User / Footer */}
        <div className="border-t border-white/[0.06] p-4 bg-[#05080f]/30" suppressHydrationWarning>
          <UserInfoCard onProfileClick={() => setShowProfileMenu(true)} tokenLoaded={tokenLoaded} />
          <button
            onClick={handleLogout}
            className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 w-full text-xs text-[rgba(240,244,250,0.4)] hover:text-[rgba(240,244,250,0.7)] hover:bg-white/[0.02] transition"
            suppressHydrationWarning
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/[0.05] bg-[#080c16] px-4 md:px-8">
          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              suppressHydrationWarning
              className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[rgba(240,244,250,0.7)]"
            >
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="h-6 w-6 rounded bg-[#14b8a6]" />
          </div>

          <div className="flex-1 lg:hidden" />

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/billing"
              className="hidden sm:flex items-center gap-2 rounded-full bg-gradient-to-r from-[#14b8a6] to-[#0d9488] px-4 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#14b8a6]/20 transition hover:scale-105 active:scale-95"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M13 7l-5-5-5 5M8 2v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upgrade
            </Link>

            <div className="relative" ref={notifRef}>
              <button
                onClick={toggleNotifs}
                suppressHydrationWarning
                className="relative p-2 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] transition group focus:outline-none"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  className={`transition ${showNotifs ? "text-white" : "text-[rgba(240,244,250,0.5)] group-hover:text-white"}`}
                >
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-[#080c16]"></span>
                )}
              </button>

              {/* Flyout */}
              {showNotifs && (
                <div className="absolute right-0 top-full mt-4 w-[calc(100vw-32px)] sm:w-96 rounded-2xl border border-white/[0.1] bg-[#111827] shadow-2xl z-[150] overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#1a2333]">
                    <h3 className="font-bold text-[#f0f4fa] text-sm tracking-tight">
                      Activity Center
                    </h3>
                    <Link
                      onClick={() => setShowNotifs(false)}
                      href="/settings?tab=notifications"
                      className="text-[rgba(240,244,250,0.5)] hover:text-white transition p-1.5 rounded-lg hover:bg-white/[0.05]"
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                      </svg>
                    </Link>
                  </div>
                  <div className="max-h-[70vh] sm:max-h-[480px] overflow-y-auto">
                    {notifs.length === 0 ? (
                      <div className="px-6 py-16 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                          <svg
                            width="24"
                            height="24"
                            fill="none"
                            stroke="rgba(240,244,250,0.2)"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-[rgba(240,244,250,0.4)]">
                          All caught up here!
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.04]">
                        {notifs.map((n: any) => {
                          const meta = TYPE_LABELS[n.type] ?? {
                            label: n.type,
                            color: "text-white",
                            emoji: "📬",
                          };
                          return (
                            <div
                              key={n.id}
                              className="flex gap-4 px-5 py-4 hover:bg-white/[0.03] transition text-left group"
                            >
                              <div className="text-2xl mt-0.5 shrink-0 grayscale group-hover:grayscale-0 transition duration-300">
                                {meta.emoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-bold text-[#f0f4fa] uppercase tracking-wider">
                                    {meta.label}
                                  </p>
                                  <p className="text-[10px] text-[rgba(240,244,250,0.3)]">
                                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                                <p className="text-xs font-semibold text-[#f0f4fa] leading-tight mb-1">
                                  {n.title}
                                </p>
                                <p className="text-xs text-[rgba(240,244,250,0.5)] line-clamp-2 leading-relaxed">
                                  {n.body}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-white/[0.06] bg-[#1a2333] p-3">
                    <Link
                      onClick={() => setShowNotifs(false)}
                      href="/notifications"
                      className="text-xs font-bold text-center text-[#14b8a6] hover:text-[#2dd4bf] transition block py-2.5 rounded-xl border border-[#14b8a6]/10 hover:border-[#14b8a6]/30 bg-[#14b8a6]/5"
                    >
                      Explore Full Feed
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8 custom-scrollbar">
          <div className={`mx-auto ${maxWidth}`}>{children}</div>
        </main>
      </div>

      {/* Profile Menu Modal */}
      {showProfileMenu && <ProfileMenu onClose={() => setShowProfileMenu(false)} />}

      {/* Idle Timeout Modal */}
      <IdleTimeoutModal isAdmin={profile?.isAdmin} />
    </div>
  );
}
