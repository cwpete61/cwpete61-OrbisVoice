"use client";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import VoiceAgentWidget from "@/app/components/VoiceAgentWidget";
import { API_BASE } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function WidgetPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const fallbackColor = searchParams.get("color") || "#14b8a6";
    const agentId = params.agentId as string;
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchAgent() {
            try {
                // Public route for agents
                const res = await fetch(`${API_BASE}/public/agents/${agentId}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Failed to load agent");
                }

                if (data.data) {
                    setAgent({
                        id: data.data.id,
                        name: data.data.name,
                        systemPrompt: data.data.systemPrompt,
                        voiceId: data.data.voiceId || "aoede",
                        voiceGender: data.data.voiceGender || "FEMALE",
                        avatarUrl: data.data.avatarUrl,
                        widgetPrimaryColor: data.data.widgetPrimaryColor,
                    });
                }
            } catch (e: any) {
                setError(e.message || "Failed to load voice assistant");
            } finally {
                setLoading(false);
            }
        }

        if (agentId && agentId !== "save-to-generate") {
            fetchAgent();
        }
    }, [agentId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#05080f]">
                <div 
                    className="w-8 h-8 border-2 rounded-full animate-spin" 
                    style={{ 
                        borderColor: `${fallbackColor}30`, 
                        borderTopColor: fallbackColor 
                    }} 
                />
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#05080f] text-center p-4">
                <div className="text-red-400 mb-2">
                    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="text-white text-sm font-bold">Assistant Unavailable</div>
                <div className="text-white/40 text-[10px] mt-1">{error}</div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full overflow-hidden bg-[#05080f]">
            <VoiceAgentWidget 
                agentId={agentId} 
                initialData={agent} 
                isWidget={true}
            />
        </div>
    );
}
