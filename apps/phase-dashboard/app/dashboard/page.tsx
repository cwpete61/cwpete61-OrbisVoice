"use client";

import React from "react";
import dynamic from "next/dynamic";

type PhaseStatus = "complete" | "in_progress" | "blocked" | "failed" | "not_started";

type Phase = {
  id: number;
  name: string;
  fullName: string;
  status: PhaseStatus;
  objective: string;
  notes: string[];
  issues: string[];
  risk: "Low" | "Medium" | "High" | "Critical";
  owner: string;
};

type FileResponse = {
  content: string;
  updatedAt?: string;
};

const FALLBACK_PHASE_STATUS = `# OrbisVoice Phase Status Tracker

current_control_file: control.md
current_phase: Phase 0 — Discovery Only
last_updated: 2026-03-19 10:00

## Phase 0 — Discovery Only

status: IN_PROGRESS

objective:
Map system architecture, workflows, dependencies, risks, and insertion points.

notes:
- Discovery started

issues:
-

## Phase 1 — Architecture Lock

status: NOT_STARTED

objective:
Define protected components and safe extension points.

notes:
-

issues:
-`;

const FALLBACK_NEXT_COMMAND = `# Next Command

control_file: control.md

Read _00 READ.md, control.md, phase-runner.md, and phase-status.md. Run Phase 0 only.`;

function normalizeStatus(value: string | undefined): PhaseStatus {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, "_") ?? "not_started";
  if (
    normalized === "complete" ||
    normalized === "in_progress" ||
    normalized === "blocked" ||
    normalized === "failed" ||
    normalized === "not_started"
  ) {
    return normalized;
  }
  return "not_started";
}

function parseHeaderValue(text: string, key: string): string {
  const match = text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : "";
}

function parsePhases(text: string): Phase[] {
  const matches = [
    ...text.matchAll(
      /##\s+(Phase\s+(\d+)\s+[—-]\s+[^\n]+)\n\nstatus:\s*([^\n]+)([\s\S]*?)(?=\n##\s+Phase\s+\d+\s+[—-]|$)/g
    ),
  ];

  return matches.map((match) => {
    const fullName = match[1].trim();
    const id = Number(match[2]);
    const rawStatus = match[3].trim();
    const body = match[4] || "";

    const objectiveMatch = body.match(/objective:\n([\s\S]*?)(?=\n[a-z_]+:|\nnotes:|\nissues:|$)/i);
    const notesMatch = body.match(/notes:\n([\s\S]*?)(?=\nissues:|\n##\s+Phase\s+\d+\s+[—-]|$)/i);
    const issuesMatch = body.match(/issues:\n([\s\S]*?)(?=\n##\s+Phase\s+\d+\s+[—-]|$)/i);

    const notes = (notesMatch?.[1] || "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line !== "-")
      .map((line) => line.replace(/^[-*]\s*/, ""));

    const issues = (issuesMatch?.[1] || "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line !== "-")
      .map((line) => line.replace(/^[-*]\s*/, ""));

    const risk: Phase["risk"] =
      id >= 12
        ? "Critical"
        : id >= 9 || id === 3 || id === 4 || id === 11
          ? "High"
          : id >= 6
            ? "Medium"
            : "Low";

    const owner =
      id === 3
        ? "Voice Runtime"
        : id === 4
          ? "Gateway"
          : id >= 6 && id <= 8
            ? "Finance"
            : id === 9
              ? "Policy"
              : id === 10
                ? "QA"
                : id === 11
                  ? "Ops"
                  : "Operator";

    return {
      id,
      name: fullName.replace(/^Phase\s+\d+\s+[—-]\s+/, ""),
      fullName,
      status: normalizeStatus(rawStatus),
      objective: objectiveMatch?.[1]?.trim() || "",
      notes,
      issues,
      risk,
      owner,
    };
  });
}

export default function DashboardPage() {
  const dashboardRef = React.useRef<HTMLDivElement | null>(null);

  const [phaseStatusText, setPhaseStatusText] = React.useState(FALLBACK_PHASE_STATUS);
  const [nextCommandText, setNextCommandText] = React.useState(FALLBACK_NEXT_COMMAND);
  const [lastSync, setLastSync] = React.useState<string>("Never");
  const [syncState, setSyncState] = React.useState<"synced" | "stale" | "offline" | "error">(
    "offline"
  );
  const [showSource, setShowSource] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [message, setMessage] = React.useState("Waiting for first sync");

  const fetchFiles = React.useCallback(async () => {
    try {
      const [phaseRes, commandRes] = await Promise.all([
        fetch("../api/dashboard/phase-status", { cache: "no-store" }),
        fetch("../api/dashboard/next-command", { cache: "no-store" }),
      ]);

      if (!phaseRes.ok || !commandRes.ok) {
        throw new Error("API request failed");
      }

      const phaseJson = (await phaseRes.json()) as FileResponse;
      const commandJson = (await commandRes.json()) as FileResponse;

      setPhaseStatusText(phaseJson.content || FALLBACK_PHASE_STATUS);
      setNextCommandText(commandJson.content || FALLBACK_NEXT_COMMAND);
      setLastSync(new Date().toLocaleString());
      setSyncState("synced");
      setMessage("Auto-sync complete");
    } catch (error) {
      console.error(error);
      setSyncState("error");
      setMessage("Auto-sync failed. Using current local state.");
    }
  }, []);

  React.useEffect(() => {
    void fetchFiles();

    const interval = window.setInterval(() => {
      void fetchFiles();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [fetchFiles]);

  const phases = React.useMemo(() => parsePhases(phaseStatusText), [phaseStatusText]);

  const currentPhaseName = parseHeaderValue(phaseStatusText, "current_phase");
  const currentControlFile =
    parseHeaderValue(phaseStatusText, "current_control_file") ||
    parseHeaderValue(nextCommandText, "control_file") ||
    "control.md";
  const lastUpdated = parseHeaderValue(phaseStatusText, "last_updated") || "—";

  const currentPhase =
    phases.find((p) => p.fullName === currentPhaseName) ||
    phases.find((p) => p.status === "in_progress");

  const completed = phases.filter((p) => p.status === "complete").length;
  const blockedCount = phases.filter((p) => p.status === "blocked").length;
  const failedCount = phases.filter((p) => p.status === "failed").length;
  const progress = phases.length ? Math.round((completed / phases.length) * 100) : 0;

  const blockers = phases
    .filter((p) => p.status === "blocked" || p.status === "failed" || p.issues.length > 0)
    .flatMap((p) => {
      const baseSeverity =
        p.status === "failed" ? "Critical" : p.status === "blocked" ? "High" : p.risk;

      const items = p.issues.length
        ? p.issues
        : [
            p.status === "blocked"
              ? "Phase is blocked"
              : p.status === "failed"
                ? "Phase failed validation"
                : "Open issue",
          ];

      return items.map((issue) => ({
        title: issue,
        severity: baseSeverity,
        area: `Phase ${p.id}`,
        action:
          p.status === "blocked" || p.status === "failed"
            ? "Review logs, narrow scope, and rerun validation"
            : "Review issue and assign next action",
      }));
    });

  const commandBody = React.useMemo(() => {
    const lines = nextCommandText.split("\n");
    const start = lines.findIndex(
      (line) => line.trim() && !line.startsWith("#") && !line.startsWith("control_file:")
    );
    return start >= 0 ? lines.slice(start).join("\n").trim() : nextCommandText.trim();
  }, [nextCommandText]);

  const statusStyles: Record<PhaseStatus, string> = {
    complete: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    blocked: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    failed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    not_started: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };

  const rowStyles: Record<PhaseStatus, string> = {
    complete: "border-l-4 border-emerald-400",
    in_progress: "border-l-4 border-amber-400 bg-amber-500/5",
    blocked: "border-l-4 border-orange-400 bg-orange-500/5",
    failed: "border-l-4 border-rose-400 bg-rose-500/5",
    not_started: "border-l-4 border-transparent",
  };

  const syncStyles = {
    synced: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    stale: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    offline: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    error: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  } as const;

  const riskStyles = {
    Low: "text-emerald-300",
    Medium: "text-amber-300",
    High: "text-orange-300",
    Critical: "text-rose-300",
  } as const;

  const severityStyles = {
    Low: "bg-emerald-500/15 text-emerald-300",
    Medium: "bg-amber-500/15 text-amber-300",
    High: "bg-orange-500/15 text-orange-300",
    Critical: "bg-rose-500/15 text-rose-300",
  } as const;

  const ExportPdfButton = React.useMemo(
    () =>
      dynamic(() => import("../../components/ExportPdfButton"), {
        ssr: false,
        loading: () => (
          <button disabled className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 opacity-50">
            Loading...
          </button>
        ),
      }),
    []
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6" ref={dashboardRef}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              OrbisVoice Phase Dashboard
            </h1>
            <p className="mt-2 text-slate-300 max-w-3xl">
              Auto-syncs from <span className="font-mono text-cyan-300">phase-status.md</span> and{" "}
              <span className="font-mono text-cyan-300">next-command.md</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchFiles()}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Refresh
            </button>

            <button
              onClick={() => setShowSource((v) => !v)}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              {showSource ? "Hide source" : "Show source"}
            </button>

            <ExportPdfButton
              dashboardRef={dashboardRef}
              isExporting={isExporting}
              setIsExporting={setIsExporting}
              setMessage={setMessage}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 flex flex-wrap items-center justify-between gap-3">
          <div>
            Status: <span className="text-cyan-300">{message}</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs ${syncStyles[syncState]}`}
            >
              {syncState}
            </span>
            <span className="text-slate-400">Last sync: {lastSync}</span>
          </div>
        </div>

        {showSource && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl">
              <div className="text-sm font-medium text-slate-200">phase-status.md</div>
              <textarea
                value={phaseStatusText}
                onChange={(e) => {
                  setPhaseStatusText(e.target.value);
                  setSyncState("stale");
                }}
                className="mt-4 h-72 w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl">
              <div className="text-sm font-medium text-slate-200">next-command.md</div>
              <textarea
                value={nextCommandText}
                onChange={(e) => {
                  setNextCommandText(e.target.value);
                  setSyncState("stale");
                }}
                className="mt-4 h-72 w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Execution overview
                </h2>
                <p className="mt-2 text-slate-300 max-w-2xl">
                  Derived directly from your current phase and next command sources.
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-right">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Environment</div>
                <div className="mt-1 text-lg font-medium">{currentControlFile}</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Program progress</span>
                <span>{progress}% complete</span>
              </div>

              <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div
            className={`rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl ${rowStyles[currentPhase?.status || "not_started"]}`}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Current phase</div>
            <div className="mt-3 text-2xl font-semibold">
              {currentPhase ? `Phase ${currentPhase.id}` : "No active phase"}
            </div>
            <div className="mt-1 text-slate-300">
              {currentPhase?.name ?? "Update phase-status.md to continue."}
            </div>
            <div
              className={`mt-4 inline-flex rounded-full border px-3 py-1 text-sm ${statusStyles[currentPhase?.status || "not_started"]}`}
            >
              {(currentPhase?.status || "not_started").replaceAll("_", " ")}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-800/60 p-4">
                <div className="text-slate-400">Completed</div>
                <div className="mt-1 text-xl font-semibold">{completed}</div>
              </div>
              <div className="rounded-2xl bg-slate-800/60 p-4">
                <div className="text-slate-400">Last updated</div>
                <div className="mt-1 text-sm font-medium">{lastUpdated}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-semibold">Execution phases</h2>
              <p className="mt-1 text-sm text-slate-400">Rendered from phase-status.md.</p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/70 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">Phase</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Risk</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((phase) => (
                    <tr
                      key={phase.id}
                      className={`border-t border-slate-800 bg-slate-900/40 hover:bg-slate-800/30 align-top ${rowStyles[phase.status]}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">Phase {phase.id}</div>
                        <div className="text-slate-300">{phase.name}</div>
                        {phase.objective && (
                          <div className="mt-1 text-xs text-slate-500">{phase.objective}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{phase.owner}</td>
                      <td className={`px-4 py-3 font-medium ${riskStyles[phase.risk]}`}>
                        {phase.risk}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusStyles[phase.status]}`}
                        >
                          {phase.status.replaceAll("_", " ")}
                        </span>
                        {phase.notes.length > 0 && (
                          <div className="mt-2 text-xs text-slate-400">{phase.notes[0]}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Next command</div>
              <div className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-sm text-cyan-300 whitespace-pre-wrap">
                {commandBody}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Open blockers</h2>
                <span className="text-sm text-slate-400">{blockers.length} total</span>
              </div>

              <div className="mt-4 space-y-3">
                {blockers.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                    No active blockers found in phase-status.md.
                  </div>
                ) : (
                  blockers.map((blocker, idx) => (
                    <div
                      key={`${blocker.area}-${idx}`}
                      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{blocker.title}</div>
                          <div className="mt-1 text-sm text-slate-400">{blocker.area}</div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            severityStyles[blocker.severity as keyof typeof severityStyles] ||
                            severityStyles.Medium
                          }`}
                        >
                          {blocker.severity}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-slate-300">Action: {blocker.action}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
              <h2 className="text-xl font-semibold">Quick stats</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-800/60 p-4">
                  <div className="text-slate-400 text-sm">Blocked</div>
                  <div className="mt-1 text-xl font-semibold text-orange-300">{blockedCount}</div>
                </div>
                <div className="rounded-2xl bg-slate-800/60 p-4">
                  <div className="text-slate-400 text-sm">Failed</div>
                  <div className="mt-1 text-xl font-semibold text-rose-300">{failedCount}</div>
                </div>
                <div className="rounded-2xl bg-slate-800/60 p-4">
                  <div className="text-slate-400 text-sm">In Progress</div>
                  <div className="mt-1 text-xl font-semibold text-amber-300">
                    {phases.filter((p) => p.status === "in_progress").length}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-800/60 p-4">
                  <div className="text-slate-400 text-sm">Critical Risk Phases</div>
                  <div className="mt-1 text-xl font-semibold text-rose-300">
                    {phases.filter((p) => p.risk === "Critical").length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
