"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";

interface UserInfoCardProps {
  onProfileClick: () => void;
  tokenLoaded?: boolean;
}

export default function UserInfoCard({ onProfileClick, tokenLoaded = true }: UserInfoCardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [avatar, setAvatar] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tokenLoaded) {
      fetchProfile();
    }
  }, [tokenLoaded]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
        if (data.data.avatar) {
          setAvatar(data.data.avatar);
        } else {
          generateAvatar(data.data.name);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAvatar = (name: string) => {
    const initials = name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const colors = ["#14b8a6", "#f97316", "#8b5cf6", "#06b6d4", "#ec4899"];
    const colorIndex = name.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect fill='${bgColor.replace("#", "%23")}' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' font-size='16' font-weight='bold' fill='white' text-anchor='middle' dy='.3em' font-family='system-ui'%3E${initials}%3C/text%3E%3C/svg%3E`;
    setAvatar(svg);
  };

  if (loading) return null;

  return (
    <div className="border-t border-white/[0.07] px-4 py-4 mt-auto">
      <button
        onClick={onProfileClick}
        className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.05] transition group"
      >
        {/* Avatar */}
        {avatar && (
          <img
            src={avatar}
            alt="Profile"
            className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
          />
        )}

        {/* User Info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-[#f0f4fa] truncate">
              {profile?.name}
            </div>
            {profile?.role === "SYSTEM_ADMIN" && (
              <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[9px] font-bold border border-purple-500/20 uppercase tracking-wider">
                System Admin
              </span>
            )}
            {profile?.role === "ADMIN" && profile?.role !== "SYSTEM_ADMIN" && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#14b8a6]/10 text-[#14b8a6] text-[9px] font-bold border border-[#14b8a6]/20 uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden mt-0.5">
            <div className="text-xs text-[rgba(240,244,250,0.5)] truncate">
              @{profile?.username || "user"}
            </div>
            <div className="text-xs text-[rgba(240,244,250,0.5)] truncate">
              {profile?.email}
            </div>
            {profile?.tenant?.creditBalance > 0 && (
              <div className="flex-shrink-0 px-1.5 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#14b8a6] text-[10px] font-bold">
                {profile.tenant.creditBalance} credits
              </div>
            )}
          </div>
        </div>

        {/* Chevron Icon */}
        <div className="text-[rgba(240,244,250,0.3)] group-hover:text-[rgba(240,244,250,0.6)] transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Auth Methods Placeholder */}
      <div className="mt-3 pt-3 border-t border-white/[0.07]">
        <div className="text-xs text-[rgba(240,244,250,0.35)] px-3 mb-2">Connected as</div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-[rgba(240,244,250,0.6)] bg-white/[0.02] border border-white/[0.05]">
          <div className="w-4 h-4 rounded-full bg-[#14b8a6]/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#14b8a6]" />
          </div>
          Password
        </div>
        <div className="text-xs text-[rgba(240,244,250,0.35)] px-3 mt-2 mb-1">Add login method</div>
        <button className="w-full text-xs px-3 py-1.5 rounded border border-white/[0.1] text-[rgba(240,244,250,0.6)] hover:text-[#f0f4fa] hover:border-white/[0.2] hover:bg-white/[0.02] transition">
          + Google
        </button>
      </div>
    </div>
  );
}