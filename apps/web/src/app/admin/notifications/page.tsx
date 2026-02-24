"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import DashboardShell from "../../components/DashboardShell";
import { useTokenFromUrl } from "../../../hooks/useTokenFromUrl";
import { API_BASE } from "@/lib/api";

const NOTIF_TYPES = [
    "COMMISSION_EARNED", "PAYOUT_PROCESSED", "PAYOUT_SCHEDULED",
    "TAX_HOLD_TRIGGERED", "TAX_HOLD_LIFTED", "LEAD_CAPTURED",
    "REFERRAL_CONVERTED", "USAGE_WARNING", "SUBSCRIPTION_EXPIRING",
    "SYSTEM_ANNOUNCEMENT", "ADMIN_MANUAL",
];

function AdminNotificationsContent() {
    const tokenLoaded = useTokenFromUrl();
    const [tab, setTab] = useState<"send" | "templates">("send");

    // Manual send state
    const [sendForm, setSendForm] = useState({ userIds: "", type: "SYSTEM_ANNOUNCEMENT", title: "", body: "", sendEmail: true });
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<string | null>(null);
    const [sendErr, setSendErr] = useState<string | null>(null);

    // Templates state
    const [templates, setTemplates] = useState<any[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [savingTemplate, setSavingTemplate] = useState(false);

    const fetchTemplates = useCallback(async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/admin/notifications/templates`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setTemplates((await res.json()).data ?? []);
    }, []);

    useEffect(() => { if (tokenLoaded) fetchTemplates(); }, [tokenLoaded, fetchTemplates]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true); setSendResult(null); setSendErr(null);
        const token = localStorage.getItem("token");
        const ids = sendForm.userIds.trim().split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
        const res = await fetch(`${API_BASE}/admin/notifications/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ userIds: ids.length ? ids : undefined, type: sendForm.type, title: sendForm.title, body: sendForm.body, sendEmail: sendForm.sendEmail }),
        });
        const data = await res.json();
        if (res.ok) setSendResult(`Sent to ${data.data?.sent ?? "??"} users`);
        else setSendErr(data.message || "Failed to send");
        setSending(false);
    };

    const handleSaveTemplate = async () => {
        if (!editingTemplate) return;
        setSavingTemplate(true);
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/admin/notifications/templates/${editingTemplate.type}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ subject: editingTemplate.subject, bodyHtml: editingTemplate.bodyHtml, enabled: editingTemplate.enabled }),
        });
        setSavingTemplate(false);
        setEditingTemplate(null);
        fetchTemplates();
    };

    return (
        <DashboardShell tokenLoaded={tokenLoaded}>
            <div className="px-6 lg:px-8 py-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[#f0f4fa]">Notification Management</h1>
                    <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Broadcast messages and manage email templates</p>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-0.5 border-b border-white/[0.06]">
                    {(["send", "templates"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 py-2.5 text-sm font-medium transition border-b-2 ${tab === t ? "border-[#14b8a6] text-[#14b8a6]" : "border-transparent text-[rgba(240,244,250,0.5)] hover:text-white"}`}>
                            {t === "send" ? "📢 Send Notification" : "✉️ Email Templates"}
                        </button>
                    ))}
                </div>

                {tab === "send" && (
                    <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
                        <h2 className="mb-5 text-sm font-semibold text-[#f0f4fa]">Broadcast a Notification</h2>
                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <label className="label-sm">User IDs <span className="text-[rgba(240,244,250,0.3)]">(leave blank for all users)</span></label>
                                <textarea rows={3} value={sendForm.userIds} onChange={(e) => setSendForm((f) => ({ ...f, userIds: e.target.value }))}
                                    placeholder="Paste user IDs, one per line or comma-separated…"
                                    className="input-field mt-1 resize-none" />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="label-sm">Notification Type</label>
                                    <select value={sendForm.type} onChange={(e) => setSendForm((f) => ({ ...f, type: e.target.value }))} className="input-field mt-1">
                                        {NOTIF_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end pb-0.5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div onClick={() => setSendForm((f) => ({ ...f, sendEmail: !f.sendEmail }))}
                                            className={`relative h-5 w-9 rounded-full transition-colors ${sendForm.sendEmail ? "bg-[#14b8a6]" : "bg-white/20"}`}>
                                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${sendForm.sendEmail ? "translate-x-4" : "translate-x-0.5"}`} />
                                        </div>
                                        <span className="text-sm text-[rgba(240,244,250,0.7)]">Also send email</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="label-sm">Title</label>
                                <input type="text" required value={sendForm.title} onChange={(e) => setSendForm((f) => ({ ...f, title: e.target.value }))}
                                    placeholder="Notification title" className="input-field mt-1" />
                            </div>
                            <div>
                                <label className="label-sm">Message</label>
                                <textarea rows={4} required value={sendForm.body} onChange={(e) => setSendForm((f) => ({ ...f, body: e.target.value }))}
                                    placeholder="Notification body text…" className="input-field mt-1 resize-none" />
                            </div>
                            {sendResult && <p className="text-sm text-green-400">✅ {sendResult}</p>}
                            {sendErr && <p className="text-sm text-red-400">❌ {sendErr}</p>}
                            <button type="submit" disabled={sending}
                                className="rounded-xl bg-[#14b8a6] px-6 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488] transition disabled:opacity-50">
                                {sending ? "Sending…" : "Send Notification"}
                            </button>
                        </form>
                    </div>
                )}

                {tab === "templates" && (
                    <div className="space-y-3">
                        {templates.length === 0 ? (
                            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] py-12 text-center text-sm text-[rgba(240,244,250,0.4)]">
                                No templates yet. They are auto-created when notifications are first sent.
                            </div>
                        ) : templates.map((tpl: any) => (
                            <div key={tpl.id} className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-5">
                                {editingTemplate?.id === tpl.id ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold uppercase tracking-widest text-[#14b8a6]">{tpl.type.replace(/_/g, " ")}</span>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <div onClick={() => setEditingTemplate((t: any) => ({ ...t, enabled: !t.enabled }))}
                                                    className={`relative h-5 w-9 rounded-full transition-colors ${editingTemplate.enabled ? "bg-[#14b8a6]" : "bg-white/20"}`}>
                                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${editingTemplate.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                                                </div>
                                                <span className="text-xs text-[rgba(240,244,250,0.5)]">Enabled</span>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="label-sm">Email Subject</label>
                                            <input type="text" value={editingTemplate.subject} onChange={(e) => setEditingTemplate((t: any) => ({ ...t, subject: e.target.value }))} className="input-field mt-1" />
                                        </div>
                                        <div>
                                            <label className="label-sm">Body HTML / Text <span className="text-[rgba(240,244,250,0.3)]">(supports {"{{name}}"}, {"{{title}}"}, {"{{body}}"})</span></label>
                                            <textarea rows={6} value={editingTemplate.bodyHtml} onChange={(e) => setEditingTemplate((t: any) => ({ ...t, bodyHtml: e.target.value }))}
                                                className="input-field mt-1 resize-none font-mono text-xs" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveTemplate} disabled={savingTemplate}
                                                className="rounded-lg bg-[#14b8a6] px-4 py-2 text-xs font-semibold text-[#05080f] hover:bg-[#0d9488] transition">
                                                {savingTemplate ? "Saving…" : "Save"}
                                            </button>
                                            <button onClick={() => setEditingTemplate(null)} className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-[rgba(240,244,250,0.5)] hover:text-white transition">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-[rgba(240,244,250,0.4)]">{tpl.type.replace(/_/g, " ")}</p>
                                            <p className="mt-1 text-sm font-medium text-[#f0f4fa]">{tpl.subject}</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className={`text-[10px] font-bold ${tpl.enabled ? "text-green-400" : "text-red-400"}`}>{tpl.enabled ? "● Enabled" : "● Disabled"}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setEditingTemplate({ ...tpl })}
                                            className="shrink-0 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-[rgba(240,244,250,0.5)] hover:text-white transition">
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <style jsx>{`
        .label-sm { display: block; font-size: 0.75rem; font-weight: 600; color: rgba(240,244,250,0.5); }
        .input-field { width: 100%; border-radius: 0.625rem; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #f0f4fa; outline: none; }
        .input-field:focus { border-color: #14b8a6; }
        .input-field option { background: #0c111d; }
      `}</style>
        </DashboardShell>
    );
}

export default function AdminNotificationsPage() {
    return <Suspense><AdminNotificationsContent /></Suspense>;
}
