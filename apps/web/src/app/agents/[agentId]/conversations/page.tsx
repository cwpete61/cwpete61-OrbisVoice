"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TranscriptCard from "@/components/TranscriptCard";

export default function AgentConversationsPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<any>(null);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);

  useEffect(() => {
    fetchAgent();
    fetchTranscripts();
  }, [agentId]);

  const fetchAgent = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${agentId}`);
      if (res.ok) {
        const data = await res.json();
        setAgent(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch agent:", err);
    }
  };

  const fetchTranscripts = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/agents/${agentId}/transcripts?limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setTranscripts(data.data?.transcripts || []);
      }
    } catch (err) {
      console.error("Failed to fetch transcripts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTranscript = async (transcriptId: string) => {
    if (!confirm("Delete this transcript?")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transcripts/${transcriptId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchTranscripts();
      }
    } catch (err) {
      console.error("Failed to delete transcript:", err);
    }
  };

  const handleViewTranscript = async (transcriptId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transcripts/${transcriptId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTranscript(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch transcript:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orbit-blue via-void to-slate">
      {/* Header */}
      <nav className="border-b border-slate px-6 py-4 bg-orbit-blue/50">
        <div className="max-w-7xl mx-auto">
          <a href="/dashboard" className="text-slate hover:text-signal-cyan text-sm mb-2 inline-block">
            ← Back to Dashboard
          </a>
          <h1 className="text-2xl font-bold text-signal-cyan">
            {agent?.name || "Agent"} - Conversation History
          </h1>
        </div>
      </nav>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        {selectedTranscript ? (
          // Transcript Detail View
          <div className="mb-8">
            <button
              onClick={() => setSelectedTranscript(null)}
              className="text-signal-cyan hover:text-aurora-green mb-4"
            >
              ← Back to List
            </button>

            <div className="bg-slate/20 border border-slate rounded-lg p-6">
              <div className="mb-4">
                <p className="text-slate text-sm mb-2">
                  {new Date(selectedTranscript.createdAt).toLocaleString()}
                </p>
                <p className="text-slate text-sm mb-4">
                  Duration: {Math.round(selectedTranscript.duration / 60)} minutes
                </p>
              </div>

              <div className="bg-orbit-blue/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-mist whitespace-pre-wrap">{selectedTranscript.content}</p>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTranscript.content);
                    alert("Transcript copied to clipboard!");
                  }}
                  className="bg-signal-cyan text-orbit-blue px-4 py-2 rounded text-sm font-semibold hover:bg-aurora-green transition"
                >
                  Copy Text
                </button>
                <button
                  onClick={() => {
                    handleDeleteTranscript(selectedTranscript.id);
                    setSelectedTranscript(null);
                  }}
                  className="bg-plasma-orange/20 text-plasma-orange px-4 py-2 rounded text-sm font-semibold hover:bg-plasma-orange/40 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Transcript List View
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-mist mb-2">Recent Conversations</h2>
              <p className="text-slate text-sm">
                {transcripts.length} conversation{transcripts.length !== 1 ? "s" : ""}
              </p>
            </div>

            {loading ? (
              <p className="text-slate">Loading conversations...</p>
            ) : transcripts.length === 0 ? (
              <div className="bg-slate/20 border border-slate rounded-lg p-12 text-center">
                <p className="text-slate">No conversations yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {transcripts.map((transcript: any) => (
                  <TranscriptCard
                    key={transcript.id}
                    id={transcript.id}
                    agentId={agentId}
                    content={transcript.content}
                    duration={transcript.duration}
                    createdAt={transcript.createdAt}
                    onView={handleViewTranscript}
                    onDelete={handleDeleteTranscript}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
