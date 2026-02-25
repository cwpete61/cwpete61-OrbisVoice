"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardShell from "../../components/DashboardShell";
import PasswordInput from "../../components/PasswordInput";
import { API_BASE } from "@/lib/api";

function UsersContent() {
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
        role: "USER",
    });
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        tier: "starter",
        commissionLevel: "LOW",
        role: "USER",
    });

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [affiliatesLoading, setAffiliatesLoading] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const adminTab = searchParams.get("tab") || "users";

    const isAdmin =
        profile?.role === "ADMIN" ||
        profile?.role === "SYSTEM_ADMIN" ||
        profile?.isAdmin ||
        profile?.username === "Oadmin" ||
        profile?.email === "admin@orbisvoice.app" ||
        tokenEmail === "admin@orbisvoice.app";

    const isSystemAdmin =
        profile?.role === "SYSTEM_ADMIN" ||
        profile?.email === "myorbislocal@gmail.com";

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
            fetchUsers(userFilter, debouncedSearch);
            fetchAffiliates(debouncedSearch);
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
            if (adminTab === "users") {
                fetchUsers(userFilter, debouncedSearch);
            } else if (adminTab === "affiliates") {
                fetchAffiliates(debouncedSearch);
            }
        }
    }, [debouncedSearch, userFilter, adminTab]);



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

    const fetchUsers = async (filter: "all" | "paid" | "free" = "all", searchTerm: string = "") => {
        setUsersLoading(true);
        try {
            const token = localStorage.getItem("token");
            const params = new URLSearchParams();
            if (filter !== "all") {
                params.set("filter", filter);
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

    const fetchAffiliates = async (searchTerm: string = "") => {
        setAffiliatesLoading(true);
        try {
            const token = localStorage.getItem("token");
            const params = new URLSearchParams();
            params.set("filter", "affiliates");
            if (searchTerm) {
                params.set("search", searchTerm);
            }
            const res = await fetch(`${API_BASE}/admin/affiliates?${params.toString()}`, {
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
                    role: createForm.role,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setCreateError(data?.message || "Failed to create user");
                return;
            }

            setCreateForm({ name: "", email: "", username: "", password: "", tier: "starter", commissionLevel: "LOW", role: "USER" });
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
            commissionLevel: user.commissionLevel || "LOW",
            role: user.role || "USER",
        });
    };

    const cancelEditUser = () => {
        setEditingUserId(null);
        setEditForm({ name: "", email: "", tier: "starter", commissionLevel: "LOW", role: "USER" });
    };

    const saveEditUser = async (userId: string) => {
        const key = `save-${userId}`;
        setActionLoading(key);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: editForm.name.trim(),
                    email: editForm.email.trim(),
                    tier: editForm.tier,
                    commissionLevel: editForm.commissionLevel,
                    role: editForm.role,
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
                fetchAffiliates(debouncedSearch);
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
            const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
                method: "PATCH",
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

    const toggleSelectUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUserIds.length === users.length && users.length > 0) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(users.map(u => u.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedUserIds.length) return;
        if (!window.confirm(`Delete ${selectedUserIds.length} selected users? This cannot be undone.`)) return;

        setActionLoading("bulk-delete");
        try {
            const token = localStorage.getItem("token");
            for (const id of selectedUserIds) {
                await fetch(`${API_BASE}/admin/users/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            setSelectedUserIds([]);
            await fetchUsers(userFilter, debouncedSearch);
        } catch (err) {
            console.error("Bulk delete failed:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkBlock = async (isBlocked: boolean) => {
        if (!selectedUserIds.length) return;
        if (!window.confirm(`${isBlocked ? "Block" : "Unblock"} ${selectedUserIds.length} selected users?`)) return;

        setActionLoading("bulk-block");
        try {
            const token = localStorage.getItem("token");
            for (const id of selectedUserIds) {
                await fetch(`${API_BASE}/admin/users/${id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ isBlocked }),
                });
            }
            setSelectedUserIds([]);
            await fetchUsers(userFilter, debouncedSearch);
        } catch (err) {
            console.error("Bulk block/unblock failed:", err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <DashboardShell>
            <div className="px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-[#f0f4fa]">All Users</h1>
                    <p className="mt-0.5 text-sm text-[rgba(240,244,250,0.45)]">
                        View all user accounts in OrbisVoice
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
                                { id: "users", label: "All Users", icon: "👥" },
                                { id: "affiliates", label: "Professional Partners", icon: "🤝" },
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



                        {adminTab === "affiliates" && (
                            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                                <div className="mb-5 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-semibold text-[#f0f4fa]">Professional Partners</h2>
                                        <p className="mt-0.5 text-xs text-[rgba(240,244,250,0.4)]">Review and manage professional partner accounts</p>
                                    </div>
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
                                                <th className="px-6 py-4">Slug & Rate</th>
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
                                                        <td className="px-6 py-4">
                                                            <div className="font-mono text-xs text-[#14b8a6]">{aff.slug}</div>
                                                            {(aff.customCommissionRate !== null || aff.lockedCommissionRate !== null) && (
                                                                <div className="mt-1 flex flex-col gap-0.5 text-[10px] uppercase tracking-wide font-medium">
                                                                    {aff.customCommissionRate !== null ? (
                                                                        <span className="text-[#f59e0b]">Custom Override: {aff.customCommissionRate}%</span>
                                                                    ) : null}
                                                                    {aff.lockedCommissionRate !== null && aff.customCommissionRate === null ? (
                                                                        <span className="text-[#14b8a6]/70">Locked Rate: {aff.lockedCommissionRate}%</span>
                                                                    ) : null}
                                                                </div>
                                                            )}
                                                        </td>
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
                                                            {aff.status === "ACTIVE" && (
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleSetCustomRate(aff)}
                                                                        disabled={actionLoading === `rate-${aff.id}`}
                                                                        className="rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/5 px-3 py-1 text-xs font-medium text-[#f59e0b] hover:bg-[#f59e0b]/10 transition disabled:opacity-50"
                                                                    >
                                                                        Set Rate
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
                                        {isSystemAdmin && (
                                            <button
                                                onClick={() => setCreateOpen((prev) => !prev)}
                                                className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-[rgba(240,244,250,0.7)] hover:border-white/[0.2] transition"
                                            >
                                                {createOpen ? "Close" : "Add user"}
                                            </button>
                                        )}
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
                                                <select
                                                    value={createForm.role}
                                                    onChange={(event) =>
                                                        setCreateForm((prev) => ({ ...prev, role: event.target.value }))
                                                    }
                                                    className="flex-1 rounded-lg border border-white/[0.08] bg-[#0c111d] px-3 py-2 text-xs text-[#f0f4fa]"
                                                >
                                                    <option value="USER">User Role</option>
                                                    <option value="ADMIN">Admin Role</option>
                                                    <option value="SYSTEM_ADMIN">System Admin</option>
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
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.length === users.length && users.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 rounded border-white/[0.1] bg-[#0c111d] text-[#14b8a6] focus:ring-offset-0 focus:ring-0"
                                                />
                                                <span className="text-xs text-[rgba(240,244,250,0.4)]">
                                                    {selectedUserIds.length > 0 ? `${selectedUserIds.length} selected` : "Select All"}
                                                </span>
                                            </div>
                                            {selectedUserIds.length > 0 && (
                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <button
                                                        onClick={() => handleBulkBlock(true)}
                                                        className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition"
                                                    >
                                                        Bulk Block
                                                    </button>
                                                    <button
                                                        onClick={() => handleBulkBlock(false)}
                                                        className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition"
                                                    >
                                                        Bulk Unblock
                                                    </button>
                                                    <button
                                                        onClick={handleBulkDelete}
                                                        className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition"
                                                    >
                                                        Bulk Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {users.map((user: any) => (
                                            <div
                                                key={user.id}
                                                className={`flex items-center justify-between rounded-xl border transition-all ${selectedUserIds.includes(user.id) ? "border-[#14b8a6]/40 bg-[#14b8a6]/5" : "border-white/[0.06] bg-[#05080f]"} px-5 py-4`}
                                            >
                                                <div className="mr-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserIds.includes(user.id)}
                                                        onChange={() => toggleSelectUser(user.id)}
                                                        className="w-4 h-4 rounded border-white/[0.1] bg-[#0c111d] text-[#14b8a6] focus:ring-offset-0 focus:ring-0"
                                                    />
                                                </div>
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
                                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${user.role === "SYSTEM_ADMIN"
                                                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                                                    : user.role === "ADMIN" || user.isAdmin
                                                                        ? "bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20"
                                                                        : "bg-white/5 text-[rgba(240,244,250,0.4)] border-white/10"
                                                                    }`}>
                                                                    {user.role === "SYSTEM_ADMIN" ? "System Admin" : (user.role === "ADMIN" || user.isAdmin ? "Admin" : "User")}
                                                                </span>
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
                                                                {isSystemAdmin && (
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

export default function UsersPage() {
    return (
        <Suspense>
            <UsersContent />
        </Suspense>
    );
}