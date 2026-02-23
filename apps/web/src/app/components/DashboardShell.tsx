"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProfileMenu from "./ProfileMenu";
import UserInfoCard from "./UserInfoCard";
import IdleTimeoutModal from "./IdleTimeoutModal";
import { API_BASE } from "@/lib/api";

const NAV = [
  {
    category: "Main",
    href: "/dashboard",
    label: "Agents",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    category: "Main",
    href: "/billing",
    label: "Billing",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
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
    label: "Tenants",
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
    label: "Subscribers",
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
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    category: "Admin",
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
    category: "Admin",
    href: "/admin/system",
    label: "System Health",
    isAdminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 022 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    category: "Admin",
    href: "/admin/audit",
    label: "Audit Logs",
    isAdminOnly: true,
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    category: "System",
    href: "/settings",
    label: "Settings",
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
    }
  }, [tokenLoaded, router]);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-[#05080f] text-[#f0f4fa]">
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
            const items = NAV.filter((item) => {
              if (item.category !== cat) return false;
              if (item.isAdminOnly) return profile?.isAdmin;
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
                  const active =
                    path === item.href ||
                    (item.href !== "/dashboard" && path.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${active
                        ? "bg-[#14b8a6]/10 text-[#14b8a6]"
                        : "text-[rgba(240,244,250,0.5)] hover:bg-white/[0.04] hover:text-[#f0f4fa]"
                        } ${(item.label === "Affiliate Professional" || item.label === "Partner Payouts")
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