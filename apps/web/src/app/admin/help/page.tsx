"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import DashboardShell from "../../components/DashboardShell";
import { useTokenFromUrl } from "../../../hooks/useTokenFromUrl";
import { API_BASE } from "@/lib/api";

function AdminHelpContent() {
    const tokenLoaded = useTokenFromUrl();
    const [tab, setTab] = useState<"questions" | "faq">("questions");

    // Question queue
    const [questions, setQuestions] = useState<any[]>([]);
    const [promoting, setPromoting] = useState<string | null>(null);
    const [promoteForm, setPromoteForm] = useState<{ [id: string]: { answer: string; category: string } }>({});

    // FAQ management
    const [faqs, setFaqs] = useState<any[]>([]);
    const [editingFaq, setEditingFaq] = useState<any | null>(null);
    const [newFaq, setNewFaq] = useState({ question: "", answer: "", category: "general" });
    const [showNewForm, setShowNewForm] = useState(false);
    const [savingFaq, setSavingFaq] = useState(false);

    const fetchQuestions = useCallback(async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/admin/help/questions`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setQuestions((await res.json()).data ?? []);
    }, []);

    const fetchFaqs = useCallback(async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/admin/help/faq`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setFaqs((await res.json()).data ?? []);
    }, []);

    useEffect(() => {
        if (tokenLoaded) { fetchQuestions(); fetchFaqs(); }
    }, [tokenLoaded, fetchQuestions, fetchFaqs]);

    const promoteQuestion = async (id: string) => {
        setPromoting(id);
        const token = localStorage.getItem("token");
        const form = promoteForm[id] ?? { answer: "", category: "general" };
        await fetch(`${API_BASE}/admin/help/questions/${id}/promote`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ answer: form.answer, category: form.category }),
        });
        setPromoting(null);
        fetchQuestions();
        fetchFaqs();
        setTab("faq");
    };

    const dismissQuestion = async (id: string) => {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/admin/help/questions/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchQuestions();
    };

    const saveFaq = async () => {
        setSavingFaq(true);
        const token = localStorage.getItem("token");
        if (editingFaq?.id) {
            await fetch(`${API_BASE}/admin/help/faq/${editingFaq.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ question: editingFaq.question, answer: editingFaq.answer, category: editingFaq.category, published: editingFaq.published }),
            });
            setEditingFaq(null);
        } else {
            await fetch(`${API_BASE}/admin/help/faq`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(newFaq),
            });
            setNewFaq({ question: "", answer: "", category: "general" });
            setShowNewForm(false);
        }
        setSavingFaq(false);
        fetchFaqs();
    };

    const deleteFaq = async (id: string) => {
        if (!confirm("Delete this FAQ entry?")) return;
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/admin/help/faq/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        fetchFaqs();
    };

    const pendingQuestions = questions.filter((q) => q.status === "pending");

    return (
        <DashboardShell tokenLoaded={tokenLoaded}>
            <div className="px-6 lg:px-8 py-8 max-w-5xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#f0f4fa]">Help Center Management</h1>
                        <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Review bot questions and manage the FAQ knowledge base</p>
                    </div>
                    {tab === "faq" && (
                        <button onClick={() => { setShowNewForm(true); setEditingFaq(null); }}
                            className="rounded-xl bg-[#14b8a6] px-4 py-2 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488] transition">
                            + Add FAQ
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-0.5 border-b border-white/[0.06]">
                    {(["questions", "faq"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition border-b-2 ${tab === t ? "border-[#14b8a6] text-[#14b8a6]" : "border-transparent text-[rgba(240,244,250,0.5)] hover:text-white"}`}>
                            {t === "questions" ? "❓ Bot Questions" : "📚 FAQ Entries"}
                            {t === "questions" && pendingQuestions.length > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white px-1">
                                    {pendingQuestions.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Questions queue */}
                {tab === "questions" && (
                    <div className="space-y-3">
                        {pendingQuestions.length === 0 ? (
                            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] py-12 text-center">
                                <p className="text-2xl mb-2">🎉</p>
                                <p className="text-sm font-medium text-[#f0f4fa]">Queue is empty</p>
                                <p className="text-xs text-[rgba(240,244,250,0.4)] mt-1">All user questions have been reviewed</p>
                            </div>
                        ) : pendingQuestions.map((q) => {
                            const form = promoteForm[q.id] ?? { answer: q.suggestedAnswer ?? "", category: "general" };
                            return (
                                <div key={q.id} className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-5 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[rgba(240,244,250,0.3)]">
                                                {new Date(q.createdAt).toLocaleDateString()} · User asked
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-[#f0f4fa]">{q.question}</p>
                                        </div>
                                        <button onClick={() => dismissQuestion(q.id)}
                                            className="shrink-0 text-xs text-[rgba(240,244,250,0.3)] hover:text-red-400 transition">Dismiss</button>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="label-sm">Approved Answer</label>
                                            <textarea rows={3} value={form.answer}
                                                onChange={(e) => setPromoteForm((f) => ({ ...f, [q.id]: { ...form, answer: e.target.value } }))}
                                                className="input-field mt-1 resize-none text-sm" placeholder="Write or edit the FAQ answer…" />
                                        </div>
                                        <div>
                                            <label className="label-sm">Category</label>
                                            <input type="text" value={form.category}
                                                onChange={(e) => setPromoteForm((f) => ({ ...f, [q.id]: { ...form, category: e.target.value } }))}
                                                className="input-field mt-1 text-sm" placeholder="e.g. billing, agents, payouts" />
                                        </div>
                                    </div>
                                    <button onClick={() => promoteQuestion(q.id)} disabled={promoting === q.id || !form.answer.trim()}
                                        className="rounded-lg bg-[#14b8a6] px-4 py-2 text-xs font-semibold text-[#05080f] hover:bg-[#0d9488] transition disabled:opacity-40">
                                        {promoting === q.id ? "Promoting…" : "✓ Promote to FAQ"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* FAQ management */}
                {tab === "faq" && (
                    <div className="space-y-3">
                        {/* New FAQ form */}
                        {showNewForm && (
                            <div className="rounded-2xl border border-[#14b8a6]/30 bg-[#14b8a6]/5 p-5 space-y-3">
                                <p className="text-sm font-semibold text-[#14b8a6]">New FAQ Entry</p>
                                <div>
                                    <label className="label-sm">Question</label>
                                    <input type="text" value={newFaq.question} onChange={(e) => setNewFaq((f) => ({ ...f, question: e.target.value }))} className="input-field mt-1" placeholder="What is…?" />
                                </div>
                                <div>
                                    <label className="label-sm">Answer</label>
                                    <textarea rows={4} value={newFaq.answer} onChange={(e) => setNewFaq((f) => ({ ...f, answer: e.target.value }))} className="input-field mt-1 resize-none" />
                                </div>
                                <div>
                                    <label className="label-sm">Category</label>
                                    <input type="text" value={newFaq.category} onChange={(e) => setNewFaq((f) => ({ ...f, category: e.target.value }))} className="input-field mt-1" placeholder="general" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={saveFaq} disabled={savingFaq || !newFaq.question || !newFaq.answer}
                                        className="rounded-lg bg-[#14b8a6] px-4 py-2 text-xs font-semibold text-[#05080f] hover:bg-[#0d9488] transition disabled:opacity-40">
                                        {savingFaq ? "Saving…" : "Create FAQ"}
                                    </button>
                                    <button onClick={() => setShowNewForm(false)} className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-[rgba(240,244,250,0.5)] hover:text-white transition">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {faqs.length === 0 && !showNewForm ? (
                            <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] py-12 text-center">
                                <p className="text-sm text-[rgba(240,244,250,0.4)]">No FAQ entries yet. Promote a bot question or add one manually.</p>
                            </div>
                        ) : faqs.map((f) => (
                            <div key={f.id} className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-5">
                                {editingFaq?.id === f.id ? (
                                    <div className="space-y-3">
                                        <div><label className="label-sm">Question</label><input type="text" value={editingFaq.question} onChange={(e) => setEditingFaq((x: any) => ({ ...x, question: e.target.value }))} className="input-field mt-1" /></div>
                                        <div><label className="label-sm">Answer</label><textarea rows={4} value={editingFaq.answer} onChange={(e) => setEditingFaq((x: any) => ({ ...x, answer: e.target.value }))} className="input-field mt-1 resize-none" /></div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div><label className="label-sm">Category</label><input type="text" value={editingFaq.category} onChange={(e) => setEditingFaq((x: any) => ({ ...x, category: e.target.value }))} className="input-field mt-1" /></div>
                                            <div className="flex items-end pb-0.5">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <div onClick={() => setEditingFaq((x: any) => ({ ...x, published: !x.published }))}
                                                        className={`relative h-5 w-9 rounded-full transition-colors ${editingFaq.published ? "bg-[#14b8a6]" : "bg-white/20"}`}>
                                                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${editingFaq.published ? "translate-x-4" : "translate-x-0.5"}`} />
                                                    </div>
                                                    <span className="text-xs text-[rgba(240,244,250,0.5)]">Published</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={saveFaq} disabled={savingFaq} className="rounded-lg bg-[#14b8a6] px-4 py-2 text-xs font-semibold text-[#05080f] hover:bg-[#0d9488] transition">{savingFaq ? "Saving…" : "Save"}</button>
                                            <button onClick={() => setEditingFaq(null)} className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-[rgba(240,244,250,0.5)] hover:text-white transition">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[rgba(240,244,250,0.35)]">{f.category}</span>
                                                <span className={`text-[10px] font-bold ${f.published ? "text-green-400" : "text-orange-400"}`}>● {f.published ? "Live" : "Draft"}</span>
                                                <span className="text-[10px] text-[rgba(240,244,250,0.3)]">👍 {f.helpful} · 👎 {f.notHelpful}</span>
                                            </div>
                                            <p className="text-sm font-semibold text-[#f0f4fa] truncate">{f.question}</p>
                                            <p className="mt-1 text-xs text-[rgba(240,244,250,0.5)] line-clamp-2">{f.answer}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => setEditingFaq({ ...f })} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-[rgba(240,244,250,0.5)] hover:text-white transition">Edit</button>
                                            <button onClick={() => deleteFaq(f.id)} className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition">Delete</button>
                                        </div>
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
      `}</style>
        </DashboardShell>
    );
}

export default function AdminHelpPage() {
    return <Suspense><AdminHelpContent /></Suspense>;
}
