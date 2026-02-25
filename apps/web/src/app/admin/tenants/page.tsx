"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/DashboardShell";
import { API_BASE } from "@/lib/api";

export default function TenantManagement() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/admin/tenants`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setTenants(data.data);
            } else {
                setError(data.message || "Failed to load tenants");
            }
        } catch (err) {
            setError("Failed to connect to API");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardShell>
            <div className="p-8">
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-[#f0f4fa]">Subscriber Management</h1>
                        <p className="mt-2 text-[rgba(240,244,250,0.5)]">Review and manage platform subscribers</p>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">
                        {error}
                    </div>
                )}

                <div className="rounded-2xl border border-white/[0.06] bg-[#0c111d] overflow-hidden shadow-xl">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.02] text-[rgba(240,244,250,0.4)] uppercase text-[10px] font-bold tracking-widest border-b border-white/[0.06]">
                            <tr>
                                <th className="px-6 py-4">Subscriber Name</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Users</th>
                                <th className="px-6 py-4">Agents</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent mx-auto" />
                                    </td>
                                </tr>
                            ) : tenants.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-[rgba(240,244,250,0.3)]">
                                        No subscribers found
                                    </td>
                                </tr>
                            ) : (
                                tenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-white/[0.02] transition">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-[#f0f4fa]">{tenant.name}</div>
                                            {tenant.billingEmail ? (
                                                <div className="text-xs text-[rgba(240,244,250,0.4)] mt-0.5">{tenant.billingEmail}</div>
                                            ) : tenant.users?.[0]?.email ? (
                                                <div className="text-xs text-[rgba(240,244,250,0.4)] mt-0.5">{tenant.users[0].email}</div>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-[rgba(240,244,250,0.3)]">{tenant.id}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${tenant.subscriptionTier === 'enterprise' ? 'bg-purple-500/10 text-purple-400' :
                                                tenant.subscriptionTier === 'professional' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-slate-500/10 text-slate-400'
                                                }`}>
                                                {tenant.subscriptionTier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[rgba(240,244,250,0.6)]">{tenant._count?.users || 0}</td>
                                        <td className="px-6 py-4 text-[rgba(240,244,250,0.6)]">{tenant._count?.agents || 0}</td>
                                        <td className="px-6 py-4 text-[rgba(240,244,250,0.4)]">
                                            {new Date(tenant.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`h-2 w-2 rounded-full inline-block mr-2 ${tenant.subscriptionStatus === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                            <span className="text-xs">{tenant.subscriptionStatus || 'free'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href={`/admin/subscribers/${tenant.id}`}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-[rgba(240,244,250,0.6)] hover:text-white hover:bg-white/[0.05] transition">
                                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                View
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardShell>
    );
}