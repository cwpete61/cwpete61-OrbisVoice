"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";
import { API_BASE } from "@/lib/api";

interface Message { role: "user" | "bot"; text: string; sources?: any[]; }

function HelpContent() {
    const tokenLoaded = useTokenFromUrl();
    const [faqs, setFaqs] = useState<any[]>([]);
    const [openFaq, setOpenFaq] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        { role: "bot", text: "Hi! I'm the OrbisVoice assistant. Ask me anything about the platform, billing, voice agents, referrals, or payouts." },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchQ, setSearchQ] = useState("");
    const chatEnd = useRef<HTMLDivElement>(null);

    useEffect(() => { fetchFaqs(); }, []);
    useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    async function fetchFaqs() {
        const res = await fetch(`${API_BASE}/help/faq`);
        if (res.ok) setFaqs((await res.json()).data ?? []);
    }

    async function sendMessage() {
        if (!input.trim() || loading) return;
        const q = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", text: q }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/help/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: q }),
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "bot", text: data.data?.answer ?? "I couldn't find an answer to that. Try rephrasing.", sources: data.data?.sources }]);
        } catch {
            setMessages((prev) => [...prev, { role: "bot", text: "Connection error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    }

    async function sendFeedback(id: string, helpful: boolean) {
        await fetch(`${API_BASE}/help/faq/${id}/feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ helpful }),
        });
    }

    const filteredFaqs = faqs.filter((f) =>
        !searchQ || f.question.toLowerCase().includes(searchQ.toLowerCase())
    );

    // Group by category
    const categories = Array.from(new Set(filteredFaqs.map((f) => f.category)));

    return (
        <DashboardShell tokenLoaded={tokenLoaded}>
            <div className="px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[#f0f4fa]">Help Center</h1>
                    <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Find answers or chat with our AI assistant</p>
                </div>

                <div className="grid gap-8 lg:grid-cols-5">
                    {/* FAQ side */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(240,244,250,0.3)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input type="text" placeholder="Search FAQ…" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-10 pr-4 py-3 text-sm text-white placeholder-[rgba(240,244,250,0.3)] focus:border-[#14b8a6] outline-none" />
                        </div>

                        {/* FAQ accordion by category */}
                        {categories.length > 0 ? categories.map((cat) => (
                            <div key={cat}>
                                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[rgba(240,244,250,0.4)]">{cat}</h2>
                                <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] overflow-hidden divide-y divide-white/[0.04]">
                                    {filteredFaqs.filter((f) => f.category === cat).map((f) => (
                                        <div key={f.id}>
                                            <button onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)}
                                                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/[0.02] transition">
                                                <span className="text-sm font-medium text-[#f0f4fa]">{f.question}</span>
                                                <svg className={`h-4 w-4 shrink-0 text-[rgba(240,244,250,0.4)] transition-transform ${openFaq === f.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                            {openFaq === f.id && (
                                                <div className="px-6 pb-5">
                                                    <p className="text-sm text-[rgba(240,244,250,0.7)] leading-relaxed">{f.answer}</p>
                                                    <div className="mt-4 flex items-center gap-3">
                                                        <span className="text-xs text-[rgba(240,244,250,0.3)]">Was this helpful?</span>
                                                        <button onClick={() => sendFeedback(f.id, true)} className="text-xs text-green-400 hover:underline">👍 Yes</button>
                                                        <button onClick={() => sendFeedback(f.id, false)} className="text-xs text-red-400 hover:underline">👎 No</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-[rgba(240,244,250,0.3)] text-sm">
                                {searchQ ? `No FAQ entries matching "${searchQ}"` : "No FAQ entries yet. Try asking the bot!"}
                            </div>
                        )}
                    </div>

                    {/* Chat bot side */}
                    <div className="lg:col-span-2 flex flex-col">
                        <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] flex flex-col" style={{ height: "620px" }}>
                            {/* Header */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
                                <div className="h-8 w-8 rounded-full bg-[#14b8a6]/20 flex items-center justify-center text-[#14b8a6] text-sm font-bold">AI</div>
                                <div>
                                    <p className="text-sm font-semibold text-[#f0f4fa]">OrbisVoice Assistant</p>
                                    <p className="text-[10px] text-[rgba(240,244,250,0.4)]">Powered by Gemini · RAG Knowledge Base</p>
                                </div>
                                <div className="ml-auto flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-[10px] text-[rgba(240,244,250,0.4)]">Online</span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user"
                                                ? "bg-[#14b8a6] text-[#05080f] rounded-br-sm"
                                                : "bg-white/[0.05] text-[rgba(240,244,250,0.85)] rounded-bl-sm"
                                            }`}>
                                            {m.text}
                                            {m.sources && m.sources.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-white/20">
                                                    <p className="text-[10px] text-[rgba(240,244,250,0.5)] mb-1">Sources:</p>
                                                    {m.sources.slice(0, 2).map((s: any, si: number) => (
                                                        <p key={si} className="text-[10px] text-[rgba(240,244,250,0.4)]">· {s.question?.slice(0, 60)}…</p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/[0.05] rounded-2xl rounded-bl-sm px-4 py-3">
                                            <div className="flex gap-1">
                                                {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#14b8a6] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEnd} />
                            </div>

                            {/* Input */}
                            <div className="border-t border-white/[0.05] p-4">
                                <div className="flex gap-2">
                                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                                        placeholder="Ask anything about OrbisVoice…"
                                        className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white placeholder-[rgba(240,244,250,0.3)] focus:border-[#14b8a6] outline-none"
                                    />
                                    <button onClick={sendMessage} disabled={loading || !input.trim()}
                                        className="rounded-xl bg-[#14b8a6] px-4 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488] transition disabled:opacity-40">
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}

export default function HelpPage() {
    return <Suspense><HelpContent /></Suspense>;
}
