"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AgentBuilderForm, { AgentData } from "@/app/components/AgentBuilderForm";
import DashboardShell from "@/app/components/DashboardShell";
import { API_BASE } from "@/lib/api";

export default function EditAgentPage() {
    const params = useParams();
    const router = useRouter();
    const agentId = params.agentId as string;

    const [agent, setAgent] = useState<AgentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function fetchAgent() {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_BASE}/agents/${agentId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Failed to load agent");
                }

                if (isMounted && data.data) {
                    setAgent({
                        id: data.data.id,
                        name: data.data.name,
                        systemPrompt: data.data.systemPrompt,
                        voiceId: data.data.voiceId || "default"
                    });
                }
            } catch (e: any) {
                if (isMounted) {
                    setError(e.message || "Something went wrong loading this agent");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        if (agentId) {
            fetchAgent();
        }

        return () => { isMounted = false; };
    }, [agentId]);

    if (loading) {
        return (
            <DashboardShell>
                <div className="flex h-[80vh] items-center justify-center p-6 bg-[#05080f]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-[#14b8a6]/30 border-t-[#14b8a6] rounded-full animate-spin" />
                        <span className="text-[rgba(240,244,250,0.5)] text-sm">Loading Agent Data...</span>
                    </div>
                </div>
            </DashboardShell>
        );
    }

    if (error || !agent) {
        return (
            <DashboardShell>
                <div className="flex flex-col h-[80vh] items-center justify-center p-6 bg-[#05080f] text-center">
                    <div className="text-red-400 mb-4">
                        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Could not load agent</h2>
                    <p className="text-[rgba(240,244,250,0.5)] text-sm mb-6 max-w-sm">
                        {error || "The agent you are looking for does not exist or you don't have permission to view it."}
                    </p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition text-sm text-white"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </DashboardShell>
        );
    }

    return <AgentBuilderForm initialData={agent} isEditing={true} />;
}
