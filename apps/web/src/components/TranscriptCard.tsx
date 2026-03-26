"use client";

interface TranscriptProps {
  id: string;
  agentId: string;
  content: string;
  duration: number;
  createdAt: string;
  estimatedCost?: number;
  revenue?: number;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function TranscriptCard({
  id,
  agentId,
  content,
  duration,
  createdAt,
  estimatedCost,
  revenue,
  onView,
  onDelete,
}: TranscriptProps) {
  const contentPreview = content.substring(0, 100) + (content.length > 100 ? "..." : "");
  const date = new Date(createdAt).toLocaleDateString();
  const time = new Date(createdAt).toLocaleTimeString();
  const durationMinutes = Math.round(duration / 60);

  return (
    <div className="bg-slate/20 border border-slate rounded-lg p-4 hover:border-signal-cyan transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <p className="text-signal-cyan text-sm font-semibold">
            {date} at {time}
          </p>
          <div className="flex gap-2 mt-1">
             <div className="text-[10px] text-slate uppercase font-bold tracking-wider">
               Cost: <span className="text-plasma-orange">${estimatedCost?.toFixed(3) || "0.000"}</span>
             </div>
             <div className="text-[10px] text-slate uppercase font-bold tracking-wider">
               Revenue: <span className="text-aurora-green">${revenue?.toFixed(2) || "0.00"}</span>
             </div>
          </div>
        </div>
        <div className="text-right text-slate text-xs">
          <div className="px-2 py-1 bg-orbit-blue/50 rounded">{durationMinutes}m</div>
        </div>
      </div>

      <p className="text-mist/80 text-sm line-clamp-2 mb-4">{contentPreview}</p>

      <div className="flex gap-2">
        {onView && (
          <button
            onClick={() => onView(id)}
            className="flex-1 text-signal-cyan hover:text-aurora-green text-sm font-semibold transition"
          >
            View
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="flex-1 text-plasma-orange hover:text-aurora-green text-sm font-semibold transition"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
