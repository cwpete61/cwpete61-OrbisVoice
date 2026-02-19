"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";

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
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    tier: "starter",
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    }
  }, [isAdmin, userFilter]);

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
      const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/users${
        params.toString() ? `?${params.toString()}` : ""
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
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCreateError(data?.message || "Failed to create user");
        return;
      }

      setCreateForm({ name: "", email: "", username: "", password: "", tier: "starter" });
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
    });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditForm({ name: "", email: "", tier: "starter" });
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
                    className={`rounded-md px-2.5 py-1 transition ${
                      userFilter === "paid"
                        ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                        : "text-[rgba(240,244,250,0.6)] hover:text-[#f0f4fa]"
                    }`}
                  >
                    Paid only
                  </button>
                  <button
                    onClick={() => setUserFilter("free")}
                    className={`rounded-md px-2.5 py-1 transition ${
                      userFilter === "free"
                        ? "bg-[#14b8a6]/20 text-[#14b8a6]"
                        : "text-[rgba(240,244,250,0.6)] hover:text-[#f0f4fa]"
                    }`}
                  >
                    Free only
                  </button>
                  <button
                    onClick={() => setUserFilter("all")}
                    className={`rounded-md px-2.5 py-1 transition ${
                      userFilter === "all"
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
                  <input
                    type="password"
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
                    <div>
                      {editingUserId === user.id ? (
                        <div className="space-y-2">
                          <input
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, name: event.target.value }))
                            }
                            className="w-64 rounded-lg border border-white/[0.08] bg-[#0c111d] px-3 py-1.5 text-xs text-[#f0f4fa]"
                          />
                          <input
                            value={editForm.email}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, email: event.target.value }))
                            }
                            className="w-64 rounded-lg border border-white/[0.08] bg-[#0c111d] px-3 py-1.5 text-xs text-[#f0f4fa]"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-[#f0f4fa]">{user.name}</p>
                          <p className="mt-0.5 text-xs text-[rgba(240,244,250,0.4)]">{user.email}</p>
                          <p className="mt-0.5 text-xs text-[rgba(240,244,250,0.35)]">@{user.username || "-"}</p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {editingUserId === user.id ? (
                          <select
                            value={editForm.tier}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, tier: event.target.value }))
                            }
                            className="rounded-lg border border-white/[0.08] bg-[#0c111d] px-2 py-1 text-xs text-[#f0f4fa]"
                          >
                            <option value="starter">starter</option>
                            <option value="professional">professional</option>
                            <option value="enterprise">enterprise</option>
                            <option value="ai-revenue-infrastructure">ai-revenue-infrastructure</option>
                          </select>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                                {
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
                              <span className="inline-flex items-center rounded-full border border-[#ef4444]/40 bg-[#ef4444]/10 px-2 py-0.5 text-[11px] font-medium text-[#ef4444]">
                                blocked
                              </span>
                            )}
                          </div>
                        )}
                        <p className="mt-1 text-xs text-[rgba(240,244,250,0.45)]">
                          Tier: {(user?.tenant?.subscriptionTier as string) || "starter"}
                        </p>
                        <p className="text-xs text-[rgba(240,244,250,0.45)]">
                          {user.role || (user.isAdmin ? "ADMIN" : "USER")}
                        </p>
                        <p className="mt-0.5 text-xs text-[rgba(240,244,250,0.35)]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
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
    </DashboardShell>
  );
}
