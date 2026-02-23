"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/DashboardShell";
import { API_BASE } from "@/lib/api";

export default function GlobalAuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [total, setTotal] = useState(0);
    const [limit] = useState(100);
    const [skip, setSkip] = useState(0);

    useEffect(() => {
        fetchLogs();
    }, [skip]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/admin/audit-logs?limit=${limit}&skip=${skip}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setLogs(data.data.logs);
                setTotal(data.data.total);
            } else {
                setError(data.message || "Failed to load audit logs");
            }
        } catch (err) {
            setError("Failed to connect to API");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success': return 'text-emerald-500 bg-emerald-500/10';
            case 'failed': return 'text-red-500 bg-red-500/10';
            default: return 'text-amber-500 bg-amber-500/10';
        }
    };

    return (
        <DashboardShell>
            <div className="p-8">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-[#f0f4fa]">System Audit Logs</h1>
                    <p className="mt-2 text-[rgba(240,244,250,0.5)]">Monitor platform-wide tool executions and agent activity</p>
                </header>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <div className="rounded-2xl border border-white/[0.06] bg-[#0c111d] overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/[0.02] text-[rgba(240,244,250,0.4)] uppercase text-[10px] font-bold tracking-widest border-b border-white/[0.06]">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Tenant</th>
                                    <th className="px-6 py-4">Agent</th>
                                    <th className="px-6 py-4">Tool</th>
                                    <th className="px-6 py-4">Duration</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {loading && logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent mx-auto" />
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-[rgba(240,244,250,0.3)]">
                                            No audit logs found
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/[0.02] transition">
                                            <td className="px-6 py-4 text-[rgba(240,244,250,0.6)] whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-[#f0f4fa]">{log.agent?.tenant?.name || 'Unknown'}</td>
                                            <td className="px-6 py-4 text-[rgba(240,244,250,0.6)]">{log.agent?.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs bg-white/[0.05] px-2 py-1 rounded text-[#14b8a6]">
                                                    {log.toolName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[rgba(240,244,250,0.4)]">{log.executionTimeMs}ms</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(log.status)}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-[10px] font-bold uppercase tracking-widest text-[#14b8a6] hover:text-[#0ea5e9] transition">
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white/[0.01] border-t border-white/[0.06] px-6 py-4 flex items-center justify-between">
                        <p className="text-xs text-[rgba(240,244,250,0.35)]">
                            Showing {logs.length} of {total} entries
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSkip(Math.max(0, skip - limit))}
                                disabled={skip === 0}
                                className="px-3 py-1 rounded border border-white/[0.1] text-xs hover:bg-white/[0.05] disabled:opacity-30"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setSkip(skip + limit)}
                                disabled={skip + limit >= total}
                                className="px-3 py-1 rounded border border-white/[0.1] text-xs hover:bg-white/[0.05] disabled:opacity-30"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
