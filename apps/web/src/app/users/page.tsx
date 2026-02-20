"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "../components/DashboardShell";
import PasswordInput from "../components/PasswordInput";

export default function UsersPage() {
  const [profile, setProfile] = useState<any>(null);
  const [tokenEmail, setTokenEmail] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userFilter, setUserFilter] = useState<"all" | "paid" | "free">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    tier: "starter",
    commissionLevel: "LOW",
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    tier: "starter",
    commissionLevel: "LOW",
  });
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [saveSettingsLoading, setSaveSettingsLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    lowCommission: 0,
    medCommission: 0,
    highCommission: 0,
    commissionDurationMonths: 0,
    defaultCommissionLevel: "LOW",
    payoutMinimum: 100,
    refundHoldDays: 14,
    payoutCycleDelayMonths: 1,
    starterLimit: 1000,
    professionalLimit: 10000,
    enterpriseLimit: 100000,
    ltdLimit: 1000,
    aiInfraLimit: 250000,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const adminTab = searchParams.get("tab") || "users";

  const isAdmin =
    profile?.role === "ADMIN" ||
    profile?.isAdmin ||
    profile?.username === "Oadmin" ||
    profile?.email === "admin@orbisvoice.app" ||
    tokenEmail === "admin@orbisvoice.app";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        setTokenEmail(payload?.email || null);
      } catch {
        setTokenEmail(null);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers(userFilter);
      fetchPlatformSettings();
      fetchAffiliates();
    }
  }, [isAdmin, userFilter]);

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
          lowCommission: data.data.lowCommission,
          medCommission: data.data.medCommission,
          highCommission: data.data.highCommission,
          commissionDurationMonths: data.data.commissionDurationMonths || 0,
          defaultCommissionLevel: data.data.defaultCommissionLevel || "LOW",
          payoutMinimum: data.data.payoutMinimum || 100,
          refundHoldDays: data.data.refundHoldDays || 14,
          payoutCycleDelayMonths: data.data.payoutCycleDelayMonths !== undefined ? data.data.payoutCycleDelayMonths : 1,
          starterLimit: data.data.starterLimit || 1000,
          professionalLimit: data.data.professionalLimit || 10000,
          enterpriseLimit: data.data.enterpriseLimit || 100000,
          ltdLimit: data.data.ltdLimit || 1000,
          aiInfraLimit: data.data.aiInfraLimit || 250000,
        });
      }
    } catch (err) {
      console.error("Failed to fetch platform settings:", err);
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
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        const data = await res.json();
        setPlatformSettings(data.data);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaveSettingsLoading(false);
    }
  };

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
      console.error("Failed to fetch profile:", err);
    }
  };

  const fetchUsers = async (filter: "all" | "paid" | "free" = "all") => {
    setUsersLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set("filter", filter);
      }
      const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/users${params.toString() ? `?${params.toString()}` : ""
        }`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAffiliates = async () => {
    setAffiliatesLoading(true);
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
      console.error("Failed to fetch affiliates:", err);
    } finally {
      setAffiliatesLoading(false);
    }
  };

  const handleUpdateAffiliateStatus = async (id: string, status: string) => {
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
      if (res.ok) {
        fetchAffiliates();
      }
    } catch (err) {
      console.error("Failed to update affiliate status:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async () => {
    setCreateError(null);
    setCreateLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          username: createForm.username.trim(),
          password: createForm.password,
          tier: createForm.tier,
          commissionLevel: createForm.commissionLevel,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCreateError(data?.message || "Failed to create user");
        return;
      }

      setCreateForm({ name: "", email: "", username: "", password: "", tier: "starter", commissionLevel: "LOW" });
      setCreateOpen(false);
      await fetchUsers(userFilter);
    } catch (err) {
      console.error("Failed to create user:", err);
      setCreateError("Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const startEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      tier: (user?.tenant?.subscriptionTier as string) || "starter",
      commissionLevel: user.commissionLevel || "LOW",
    });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditForm({ name: "", email: "", tier: "starter", commissionLevel: "LOW" });
  };

  const saveEditUser = async (userId: string) => {
    const key = `save-${userId}`;
    setActionLoading(key);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          tier: editForm.tier,
          commissionLevel: editForm.commissionLevel,
        }),
      });

      if (res.ok) {
        await fetchUsers(userFilter);
        cancelEditUser();
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const promoteToAffiliate = async (userId: string) => {
    if (!confirm("Are you sure you want to promote this user to a professional partner?")) return;

    setActionLoading(`promote-${userId}`);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/affiliates/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("User successfully promoted to Professional Partner!");
        fetchUsers(userFilter);
        fetchAffiliates();
      } else {
        alert(data.message || "Failed to promote user");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleBlockUser = async (user: any) => {
    const key = `block-${user.id}`;
    setActionLoading(key);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user.id}/block`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isBlocked: !user.isBlocked,
        }),
      });

      if (res.ok) {
        await fetchUsers(userFilter);
      }
    } catch (err) {
      console.error("Failed to update block status:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (user: any) => {
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) {
      return;
    }

    const key = `delete-${user.id}`;
    setActionLoading(key);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchUsers(userFilter);
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardShell>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#f0f4fa]">Subscribers</h1>
          <p className="mt-0.5 text-sm text-[rgba(240,244,250,0.45)]">
            View all subscriber accounts in OrbisVoice
          </p>
        </div>

        {!isAdmin ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <p className="text-sm text-[rgba(240,244,250,0.5)]">Admin access required.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Admin Tabs */}
            <div className="flex items-center gap-1 border-b border-white/[0.07] px-1">
              {[
                { id: "users", label: "Subscribers", icon: "👥" },
                { id: "affiliates", label: "Affiliates", icon: "🤝" },
                { id: "settings", label: "Commission Settings", icon: "⚙️" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => router.push(`?tab=${tab.id}`)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all ${adminTab === tab.id
                    ? "border-b-2 border-[#14b8a6] text-[#14b8a6]"
                    : "text-[rgba(240,244,250,0.5)] hover:text-[#f0f4fa]"
                    }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {adminTab === "settings" && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[#f0f4fa]">Global Commission Levels</h2>
                    <p className="mt-0.5 text-xs text-[rgba(240,244,250,0.4)]">Set default commission rates for all levels</p>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saveSettingsLoading}
                    className="rounded-lg border border-[#14b8a6]/40 bg-[#14b8a6]/10 px-4 py-2 text-xs font-medium text-[#14b8a6] hover:bg-[#14b8a6]/20 transition disabled:opacity-50"
                  >
                    {saveSettingsLoading ? "Saving..." : "Save Rates"}
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Low Commission (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={settingsForm.lowCommission}
                        onChange={(e) => setSettingsForm({ ...settingsForm, lowCommission: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                      />
                      <span className="absolute right-3 top-2 text-xs text-[rgba(240,244,250,0.3)]">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Medium Commission (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={settingsForm.medCommission}
                        onChange={(e) => setSettingsForm({ ...settingsForm, medCommission: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                      />
                      <span className="absolute right-3 top-2 text-xs text-[rgba(240,244,250,0.3)]">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">High Commission (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={settingsForm.highCommission}
                        onChange={(e) => setSettingsForm({ ...settingsForm, highCommission: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                      />
                      <span className="absolute right-3 top-2 text-xs text-[rgba(240,244,250,0.3)]">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Global System Default Commission</label>
                    <div className="relative">
                      <select
                        value={settingsForm.defaultCommissionLevel}
                        onChange={(e) => setSettingsForm({ ...settingsForm, defaultCommissionLevel: e.target.value })}
                        className="w-full rounded-lg border border-[#14b8a6]/40 bg-[#14b8a6]/5 px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/80 focus:bg-[#14b8a6]/10 focus:outline-none transition appearance-none cursor-pointer"
                      >
                        <option className="bg-[#05080f] text-[#f0f4fa]" value="LOW">Low Commission (System Default)</option>
                        <option className="bg-[#05080f] text-[#f0f4fa]" value="MED">Medium Commission (System Default)</option>
                        <option className="bg-[#05080f] text-[#f0f4fa]" value="HIGH">High Commission (System Default)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#f0f4fa]/50">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Duration (Months, 0=Lifetime)</label>
                    <input
                      type="number"
                      value={settingsForm.commissionDurationMonths}
                      onChange={(e) => setSettingsForm({ ...settingsForm, commissionDurationMonths: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Payout Minimum ($)</label>
                    <input
                      type="number"
                      value={settingsForm.payoutMinimum}
                      onChange={(e) => setSettingsForm({ ...settingsForm, payoutMinimum: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Payout Delay Cycles (Months)</label>
                    <input
                      type="number"
                      value={settingsForm.payoutCycleDelayMonths}
                      onChange={(e) => setSettingsForm({ ...settingsForm, payoutCycleDelayMonths: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Refund Hold (Days)</label>
                    <input
                      type="number"
                      value={settingsForm.refundHoldDays}
                      onChange={(e) => setSettingsForm({ ...settingsForm, refundHoldDays: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="mt-12 mb-5">
                  <h2 className="text-sm font-semibold text-[#f0f4fa]">Tier Conversation Limits</h2>
                  <p className="mt-0.5 text-xs text-[rgba(240,244,250,0.4)]">Monthly conversation allotments per subscription tier</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Starter Tier</label>
                    <input
                      type="number"
                      value={settingsForm.starterLimit}
                      onChange={(e) => setSettingsForm({ ...settingsForm, starterLimit: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Professional Tier</label>
                    <input
                      type="number"
                      value={settingsForm.professionalLimit}
                      onChange={(e) => setSettingsForm({ ...settingsForm, professionalLimit: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">Enterprise Tier</label>
                    <input
                      type="number"
                      value={settingsForm.enterpriseLimit}
                      onChange={(e) => setSettingsForm({ ...settingsForm, enterpriseLimit: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">LTD Tier</label>
                    <input
                      type="number"
                      value={settingsForm.ltdLimit}
                      onChange={(e) => setSettingsForm({ ...settingsForm, ltdLimit: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">AI Revenue Infra</label>
                    <input
                      type="number"
                      value={settingsForm.aiInfraLimit}
                      onChange={(e) => setSettingsForm({ ...settingsForm, aiInfraLimit: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2 text-sm text-[#f0f4fa] focus:border-[#14b8a6]/50 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {adminTab === "affiliates" && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[#f0f4fa]">Affiliate Partners</h2>
                    <p className="mt-0.5 text-xs text-[rgba(240,244,250,0.4)]">Review and manage affiliate applications</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111827] text-xs font-medium uppercase tracking-wider text-[rgba(240,244,250,0.4)]">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Slug</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Balance</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {affiliatesLoading ? (
                        <tr><td colSpan={5} className="py-12 text-center text-xs text-white/30">Loading affiliates...</td></tr>
                      ) : affiliates.length > 0 ? (
                        affiliates.map((aff) => (
                          <tr key={aff.id} className="hover:bg-white/[0.02]">
                            <td className="px-6 py-4">
                              <div className="font-medium text-[#f0f4fa]">{aff.user?.name}</div>
                              <div className="text-xs text-[rgba(240,244,250,0.4)]">{aff.user?.email}</div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-[#14b8a6]">{aff.slug}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${aff.status === "ACTIVE"
                                ? "bg-green-500/10 text-green-400"
                                : aff.status === "PENDING"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : "bg-red-500/10 text-red-400"
                                }`}>
                                {aff.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[#f0f4fa]">${aff.balance.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">
                              {aff.status === "PENDING" && (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleUpdateAffiliateStatus(aff.id, "ACTIVE")}
                                    disabled={actionLoading === aff.id}
                                    className="rounded-lg bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 hover:bg-green-500/20"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateAffiliateStatus(aff.id, "REJECTED")}
                                    disabled={actionLoading === aff.id}
                                    className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="py-12 text-center text-xs text-white/30">No affiliate applications found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminTab === "users" && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#f0f4fa]">Subscribers</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCreateOpen((prev) => !prev)}
                      className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-[rgba(240,244,250,0.7)] hover:border-white/[0.2] transition"
                    >
                      {createOpen ? "Close" : "Add user"}
                    </button>
                    <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#05080f] p-1 text-xs">
                      <button
                        onClick={() => setUserFilter("paid")}
                        className={`rounded-md px-2.5 py-1 transition ${userFilter === "paid"
                          ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                          : "text-[rgba(240,244,250,0.6)] hover:text-[#f0f4fa]"
                          }`}
                      >
                        Paid only
                      </button>
                      <button
                        onClick={() => setUserFilter("free")}
                        className={`rounded-md px-2.5 py-1 transition ${userFilter === "free"
                          ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                          : "text-[rgba(240,244,250,0.6)] hover:text-[#f0f4fa]"
                          }`}
                      >
                        Free only
                      </button>
                      <button
                        onClick={() => setUserFilter("all")}
                        className={`rounded-md px-2.5 py-1 transition ${userFilter === "all"
                          ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                          : "text-[rgba(240,244,250,0.6)] hover:text-[#f0f4fa]"
                          }`}
                      >
                        All
                      </button>
                    </div>
                    <button
                      onClick={() => fetchUsers(userFilter)}
                      className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-[rgba(240,244,250,0.7)] hover:border-white/[0.2] transition"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {createOpen && (
                  <div className="mb-5 rounded-xl border border-white/[0.06] bg-[#05080f] p-4">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                      <input
                        value={createForm.name}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        placeholder="Name"
                        className="rounded-lg border border-white/[0.08] bg-[#0c111d] px-3 py-2 text-xs text-[#f0f4fa]"
                      />
                      <input
                        value={createForm.email}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        placeholder="Email"
                        className="rounded-lg border border-white/[0.08] bg-[#0c111d] px-3 py-2 text-xs text-[#f0f4fa]"
                      />
                      <input
                        value={createForm.username}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, username: event.target.value }))
                        }
                        placeholder="Username"
                        className="rounded-lg border border-white/[0.08] bg-[#0c111d] px-3 py-2 text-xs text-[#f0f4fa]"
                      />
                      <PasswordInput
                        value={createForm.password}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, password: event.target.value }))
                        }
                        placeholder="Temp password"
                        className="rounded-lg border border-white/[0.08] bg-[#0c111d] px-3 py-2 text-xs text-[#f0f4fa]"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={createForm.tier}
                          onChange={(event) =>
                            setCreateForm((prev) => ({ ...prev, tier: event.target.value }))
                          }
                          className="flex-1 rounded-lg border border-white/[0.08] bg-[#0c111d] px-3 py-2 text-xs text-[#f0f4fa]"
                        >
                          <option value="starter">starter</option>
                          <option value="professional">professional</option>
                          <option value="enterprise">enterprise</option>
                          <option value="ai-revenue-infrastructure">ai-revenue-infrastructure</option>
                        </select>
                        <select
                          value={createForm.commissionLevel}
                          onChange={(event) =>
                            setCreateForm((prev) => ({ ...prev, commissionLevel: event.target.value }))
                          }
                          className="flex-1 rounded-lg border border-white/[0.08] bg-[#0c111d] px-3 py-2 text-xs text-[#f0f4fa]"
                        >
                          <option value="LOW">Low Comm</option>
                          <option value="MED">Med Comm</option>
                          <option value="HIGH">High Comm</option>
                        </select>
                        <button
                          onClick={handleCreateUser}
                          disabled={createLoading}
                          className="rounded-lg border border-[#14b8a6]/40 bg-[#14b8a6]/10 px-3 py-2 text-xs text-[#14b8a6] hover:bg-[#14b8a6]/20 transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {createLoading ? "Adding..." : "Add"}
                        </button>
                      </div>
                    </div>
                    {createError && (
                      <p className="mt-2 text-xs text-[#f97316]">{createError}</p>
                    )}
                  </div>
                )}

                {usersLoading ? (
                  <p className="text-sm text-[rgba(240,244,250,0.4)]">Loading users…</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-[rgba(240,244,250,0.4)]">None.</p>
                ) : (
                  <div className="space-y-3">
                    {users.map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#05080f] px-5 py-4"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          {editingUserId === user.id ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                value={editForm.name}
                                onChange={(event) =>
                                  setEditForm((prev) => ({ ...prev, name: event.target.value }))
                                }
                                className="w-full sm:w-48 rounded-lg border border-white/[0.08] bg-[#0c111d] px-3 py-1.5 text-xs text-[#f0f4fa]"
                                placeholder="Name"
                              />
                              <input
                                value={editForm.email}
                                onChange={(event) =>
                                  setEditForm((prev) => ({ ...prev, email: event.target.value }))
                                }
                                className="w-full sm:w-64 rounded-lg border border-white/[0.08] bg-[#0c111d] px-3 py-1.5 text-xs text-[#f0f4fa]"
                                placeholder="Email"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-3">
                              <p className="text-sm font-semibold text-[#f0f4fa] truncate">{user.name}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs truncate">
                                <span className="hidden xl:block w-1 h-1 rounded-full bg-white/[0.15]"></span>
                                <p className="text-[rgba(240,244,250,0.5)] truncate">{user.email}</p>
                                <span className="w-1 h-1 rounded-full bg-white/[0.15]"></span>
                                <p className="text-[rgba(240,244,250,0.35)] truncate">@{user.username || "-"}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                          <div className="flex flex-col items-start sm:items-end gap-1.5">
                            {editingUserId === user.id ? (
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <select
                                  value={editForm.tier}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({ ...prev, tier: event.target.value }))
                                  }
                                  className="rounded-lg border border-white/[0.08] bg-[#0c111d] px-2 py-1.5 text-xs text-[#f0f4fa]"
                                >
                                  <option value="starter">starter</option>
                                  <option value="professional">professional</option>
                                  <option value="enterprise">enterprise</option>
                                  <option value="ai-revenue-infrastructure">ai-revenue-infrastructure</option>
                                </select>
                                <select
                                  value={editForm.commissionLevel}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({ ...prev, commissionLevel: event.target.value }))
                                  }
                                  className="block rounded-lg border border-white/[0.08] bg-[#0c111d] px-2 py-1.5 text-xs text-[#f0f4fa]"
                                >
                                  <option value="LOW">Low Comm</option>
                                  <option value="MED">Med Comm</option>
                                  <option value="HIGH">High Comm</option>
                                </select>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 text-[11px] text-[rgba(240,244,250,0.45)]">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium border ${{
                                    active: "border-[#14b8a6]/30 bg-[#14b8a6]/10 text-[#14b8a6]",
                                    trialing: "border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]",
                                    canceled: "border-[#f97316]/30 bg-[#f97316]/10 text-[#f97316]",
                                    past_due: "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]",
                                    free: "border-white/[0.15] bg-white/[0.03] text-[rgba(240,244,250,0.6)]",
                                  }[(user?.tenant?.subscriptionStatus as string) || "free"] ||
                                    "border-white/[0.15] bg-white/[0.03] text-[rgba(240,244,250,0.6)]"
                                    }`}
                                >
                                  {(user?.tenant?.subscriptionStatus as string) || "free"}
                                </span>
                                {user.isBlocked && (
                                  <span className="inline-flex items-center rounded-full border border-[#ef4444]/40 bg-[#ef4444]/10 px-2 py-0.5 font-medium text-[#ef4444]">
                                    blocked
                                  </span>
                                )}
                                <span className="hidden xl:block w-1 h-1 rounded-full bg-white/[0.15]"></span>
                                <span>Tier: <span className="text-[#f0f4fa]">{(user?.tenant?.subscriptionTier as string) || "starter"}</span></span>
                                <span className="w-1 h-1 rounded-full bg-white/[0.15]"></span>
                                <span>Comm: <span className="text-[#14b8a6]">{user.commissionLevel || "LOW"}</span></span>
                                <span className="w-1 h-1 rounded-full bg-white/[0.15]"></span>
                                <span className="uppercase font-semibold text-[rgba(240,244,250,0.6)]">{user.role || (user.isAdmin ? "ADMIN" : "USER")}</span>
                                <span className="w-1 h-1 rounded-full bg-white/[0.15]"></span>
                                <span className="text-[rgba(240,244,250,0.35)]">{new Date(user.createdAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {editingUserId === user.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => saveEditUser(user.id)}
                                  disabled={actionLoading === `save-${user.id}`}
                                  className="rounded-lg border border-[#14b8a6]/40 bg-[#14b8a6]/10 px-3 py-1.5 text-xs text-[#14b8a6] hover:bg-[#14b8a6]/20 transition disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditUser}
                                  className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[rgba(240,244,250,0.7)] hover:border-white/[0.3] transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditUser(user)}
                                  className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[rgba(240,244,250,0.7)] hover:border-white/[0.3] transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => toggleBlockUser(user)}
                                  disabled={actionLoading === `block-${user.id}`}
                                  className="rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-1.5 text-xs text-[#f59e0b] hover:bg-[#f59e0b]/20 transition disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {user.isBlocked ? "Unblock" : "Block"}
                                </button>
                                {!user.affiliate && !user.isAdmin && (
                                  <button
                                    onClick={() => promoteToAffiliate(user.id)}
                                    disabled={actionLoading === `promote-${user.id}`}
                                    className="rounded-lg border border-[#14b8a6]/40 bg-[#14b8a6]/5 px-3 py-1.5 text-xs text-[#14b8a6] hover:bg-[#14b8a6]/10 transition disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Promote to Partner
                                  </button>
                                )}
                                {user.affiliate && (
                                  <div className="flex items-center gap-1 rounded-lg bg-[#14b8a6]/10 px-3 py-1.5 text-[10px] font-bold text-[#14b8a6] uppercase tracking-wider">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6] animate-pulse" />
                                    Partner
                                  </div>
                                )}
                                <button
                                  onClick={() => deleteUser(user)}
                                  disabled={actionLoading === `delete-${user.id}`}
                                  className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-1.5 text-xs text-[#ef4444] hover:bg-[#ef4444]/20 transition disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
