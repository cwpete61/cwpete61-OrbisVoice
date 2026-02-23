"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProfileMenu from "./ProfileMenu";
import UserInfoCard from "./UserInfoCard";
import IdleTimeoutModal from "./IdleTimeoutModal";
import { API_BASE } from "@/lib/api";

const AFFILIATE_NAV = [
    {
        href: "/affiliates",
        label: "Marketplace",
        icon: (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
        ),
    },
    {
        href: "/dashboard",
        label: "Service Dashboard",
        icon: (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
];

export default function AffiliateShell({ children }: { children: React.ReactNode }) {
    const path = usePathname();
    const router = useRouter();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const res = await fetch(`${API_BASE}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data.data);

                // Check if user is an affiliate
                const affRes = await fetch(`${API_BASE}/affiliates/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (affRes.ok) {
                    const affData = await affRes.json();
                    if (affData.data.status !== "ACTIVE" && !data.data.isAdmin) {
                        router.push("/dashboard");
                    }
                } else {
                    router.push("/dashboard");
                }
            } else {
                router.push("/login");
            }
        } catch (err) {
            console.error("Affiliate auth error:", err);
            router.push("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/");
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#05080f]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#14b8a6] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#05080f] text-[#f0f4fa]">
            {/* Sidebar */}
            <aside className="flex w-56 flex-col border-r border-[#14b8a6]/10 bg-[#080c16]">
                {/* Logo */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-[calc(1.25rem+10px)]">
                    <div className="h-7 w-7 rounded-md bg-[#14b8a6]" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight">Partner Portal</span>
                        <span className="text-[10px] font-medium text-[#14b8a6] uppercase tracking-wider">Affiliate</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-0.5 px-3 py-4">
                    {AFFILIATE_NAV.map((item) => {
                        const active = path === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active
                                    ? "bg-[#14b8a6]/10 text-[#14b8a6]"
                                    : "text-[rgba(240,244,250,0.5)] hover:bg-white/[0.04] hover:text-[#f0f4fa]"
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Card */}
                <div className="border-t border-white/[0.06] px-3 py-4">
                    <UserInfoCard onProfileClick={() => setShowProfileMenu(true)} tokenLoaded={true} />
                    <button
                        onClick={handleLogout}
                        className="mt-4 flex items-center gap-2 w-full px-3 py-2 text-xs text-white/30 hover:text-white/60 transition"
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                        </svg>
                        Sign Out
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