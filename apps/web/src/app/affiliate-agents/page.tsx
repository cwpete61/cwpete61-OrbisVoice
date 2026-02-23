"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "../components/DashboardShell";
import PasswordInput from "../components/PasswordInput";
import { API_BASE } from "@/lib/api";

function AffiliateAgentsContent() {
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
      fetchUsers("all", debouncedSearch);
      fetchPlatformSettings();
      fetchAffiliates();
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
      fetchUsers(userFilter, debouncedSearch);
    }
  }, [debouncedSearch, userFilter]);

  const fetchPlatformSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/platform-settings`, {
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
        setCreateForm(prev => ({
          ...prev,
          commissionLevel: data.data.defaultCommissionLevel || "LOW"
        }));
      }
    } catch (err) {
      console.error("Failed to fetch platform settings:", err);
    }
  };

  const handleSaveSettings = async () => {
    setSaveSettingsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/platform-settings`, {
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
        await fetchUsers(userFilter, debouncedSearch);
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

  const fetchUsers = async (subFilter: "all" | "paid" | "free" = "all", searchTerm: string = "") => {
    setUsersLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.set("filter", "affiliates");
      if (subFilter !== "all") {
        params.set("subFilter", subFilter);
      }
      if (searchTerm) {
        params.set("search", searchTerm);
      }
      const url = `${API_BASE}/admin/users?${params.toString()}`;

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
      const res = await fetch(`${API_BASE}/admin/affiliates?filter=affiliates`, {
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
      const res = await fetch(`${API_BASE}/admin/affiliates/${id}/status`, {
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

  const handleSetCustomRate = async (aff: any) => {
    const currentRate = aff.customCommissionRate !== null ? aff.customCommissionRate : "";
    const input = window.prompt(`Enter a custom commission rate (%) for ${aff.user?.name}, or leave blank to clear the override and use the global/locked rate:`, String(currentRate));
    if (input === null) return;

    let customCommissionRate: number | null = null;
    if (input.trim() !== "") {
      const parsed = parseFloat(input);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        alert("Please enter a valid percentage between 0 and 100.");
        return;
      }
      customCommissionRate = parsed;
    }

    setActionLoading(`rate-${aff.id}`);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/affiliates/${aff.id}/commission-rate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customCommissionRate }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchAffiliates();
      } else {
        alert("Failed to update rate: " + data.message);
      }
    } catch (err) {
      console.error("Failed to update custom commission rate:", err);
      alert("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async () => {
    setCreateError(null);
    setCreateLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/users`, {
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
          isAffiliate: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCreateError(data?.message || "Failed to create user");
        return;
      }

      setCreateForm({ name: "", email: "", username: "", password: "", tier: "starter", commissionLevel: platformSettings?.defaultCommissionLevel || "LOW" });
      setCreateOpen(false);
      await fetchUsers(userFilter, debouncedSearch);
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
      commissionLevel: user.commissionLevel || platformSettings?.defaultCommissionLevel || "LOW",
    });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditForm({ name: "", email: "", tier: "starter", commissionLevel: platformSettings?.defaultCommissionLevel || "LOW" });
  };

  const saveEditUser = async (userId: string) => {
    const key = `save-${userId}`;
    setActionLoading(key);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
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
        await fetchUsers(userFilter, debouncedSearch);
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
      const res = await fetch(`${API_BASE}/admin/affiliates/promote`, {
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
        fetchUsers(userFilter, debouncedSearch);
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
      const res = await fetch(`${API_BASE}/admin/users/${user.id}/block`, {
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
        await fetchUsers(userFilter, debouncedSearch);
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
      const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchUsers(userFilter, debouncedSearch);
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
          <h1 className="text-xl font-bold text-[#f0f4fa]">Professional Partner Management</h1>
          <p className="mt-0.5 text-sm text-[rgba(240,244,250,0.45)]">
            Manage approved professional partners and applications
          </p>
        </div>

        {!isAdmin ? (
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
            <p className="text-sm text-[rgba(240,244,250,0.5)]">Admin access required.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#f0f4fa]">Professional Partners</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search name, email..."
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
                      All Professional
                    </button>
                  </div>
                  <button
                    onClick={() => fetchUsers(userFilter, debouncedSearch)}
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
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default function AffiliateAgentsPage() {
  return (
    <Suspense>
      <AffiliateAgentsContent />
    </Suspense>
  );
}