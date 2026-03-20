import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function OrbisVoicePhaseDashboard() {
  const defaultPhaseStatus = `# OrbisVoice Phase Status Tracker

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
-

## Phase 2 — Controlled Mutation Test

status: NOT_STARTED

objective:
Validate safe mutation capability using a low-risk tool.

notes:
-

issues:
-

## Phase 3 — Gateway Migration

status: NOT_STARTED

objective:
Move Gemini Live session from frontend to gateway.

notes:
-

issues:
-

## Phase 4 — Tool Interception Layer

status: NOT_STARTED

objective:
Enable gateway-based tool execution.

notes:
-

issues:
-

## Phase 5 — Staging Validation Mode

status: NOT_STARTED

objective:
Validate runtime policy and gating in staging.

notes:
-

issues:
-

## Phase 6 — Usage Tracking

status: NOT_STARTED

objective:
Track tokens, minutes, and tool usage.

notes:
-

issues:
-

## Phase 7 — Pricing Registry

status: NOT_STARTED

objective:
Centralize cost and pricing logic.

notes:
-

issues:
-

## Phase 8 — Revenue and Margin

status: NOT_STARTED

objective:
Compute cost, revenue, and margin per session.

notes:
-

issues:
-

## Phase 9 — Runtime Policy Enforcement

status: NOT_STARTED

objective:
Enforce plan limits, compliance, and cost thresholds.

notes:
-

issues:
-

## Phase 10 — Regression Harness

status: NOT_STARTED

objective:
Protect system from regressions.

notes:
-

issues:
-

## Phase 11 — Load and Staging Stress Validation

status: NOT_STARTED

objective:
Test system under load.

notes:
-

issues:
-

## Phase 12 — Production Readiness Review

status: NOT_STARTED

objective:
Confirm system readiness before production.

notes:
-

issues:
-

## Phase 13 — Production Execution

status: NOT_STARTED

objective:
Deploy system under production controls.

notes:
-

issues:
-`;

  const defaultNextCommand = `# Next Command

control_file: control.md

Read _00 READ.md, control.md, phase-runner.md, and phase-status.md. Run Phase 0 only.`;

  const dashboardRef = React.useRef(null);
  const phaseInputRef = React.useRef(null);
  const commandInputRef = React.useRef(null);

  const [phaseStatusText, setPhaseStatusText] = React.useState(defaultPhaseStatus);
  const [nextCommandText, setNextCommandText] = React.useState(defaultNextCommand);
  const [showConfig, setShowConfig] = React.useState(true);
  const [dragTarget, setDragTarget] = React.useState(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [message, setMessage] = React.useState("Ready");

  const normalizeStatus = (value) => value?.trim().toLowerCase().replace(/\s+/g, "_") || "not_started";

  const parseHeaderValue = (text, key) => {
    const match = text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return match ? match[1].trim() : "";
  };

  const parsePhases = (text) => {
    const matches = [...text.matchAll(/##\s+(Phase\s+(\d+)\s+[—-]\s+[^\n]+)\n\nstatus:\s*([^\n]+)([\s\S]*?)(?=\n##\s+Phase\s+\d+\s+[—-]|$)/g)];

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

      const risk = id >= 12 ? "Critical" : id >= 9 || id === 3 || id === 4 || id === 11 ? "High" : id >= 6 ? "Medium" : "Low";
      const owner =
        id === 3 ? "Voice Runtime" :
        id === 4 ? "Gateway" :
        id >= 6 && id <= 8 ? "Finance" :
        id === 9 ? "Policy" :
        id === 10 ? "QA" :
        id === 11 ? "Ops" :
        "Operator";

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
  };

  const phases = React.useMemo(() => parsePhases(phaseStatusText), [phaseStatusText]);
  const currentPhaseName = parseHeaderValue(phaseStatusText, "current_phase");
  const currentControlFile = parseHeaderValue(phaseStatusText, "current_control_file") || parseHeaderValue(nextCommandText, "control_file") || "control.md";
  const lastUpdated = parseHeaderValue(phaseStatusText, "last_updated") || "—";
  const currentPhase = phases.find((p) => p.fullName === currentPhaseName) || phases.find((p) => p.status === "in_progress");
  const completed = phases.filter((p) => p.status === "complete").length;
  const blockedCount = phases.filter((p) => p.status === "blocked").length;
  const failedCount = phases.filter((p) => p.status === "failed").length;
  const progress = phases.length ? Math.round((completed / phases.length) * 100) : 0;

  const blockers = phases
    .filter((p) => p.status === "blocked" || p.status === "failed" || p.issues.length > 0)
    .flatMap((p) => {
      const baseSeverity = p.status === "failed" ? "Critical" : p.status === "blocked" ? "High" : p.risk;
      const items = p.issues.length ? p.issues : [p.status === "blocked" ? "Phase is blocked" : p.status === "failed" ? "Phase failed validation" : "Open issue"];
      return items.map((issue) => ({
        title: issue,
        severity: baseSeverity,
        area: `Phase ${p.id}`,
        action: p.status === "blocked" || p.status === "failed" ? "Review logs, narrow scope, and rerun validation" : "Review issue and assign next action",
      }));
    });

  const commandBody = React.useMemo(() => {
    const lines = nextCommandText.split("\n");
    const start = lines.findIndex((l) => l.trim() && !l.startsWith("#") && !l.startsWith("control_file:"));
    return start >= 0 ? lines.slice(start).join("\n").trim() : nextCommandText.trim();
  }, [nextCommandText]);

  const statusStyles = {
    complete: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_0_1px_rgba(251,191,36,0.15)]",
    blocked: "bg-orange-500/15 text-orange-300 border-orange-500/30 shadow-[0_0_0_1px_rgba(251,146,60,0.15)]",
    failed: "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_0_1px_rgba(244,63,94,0.15)]",
    not_started: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };

  const rowStyles = {
    complete: "border-l-4 border-emerald-400",
    in_progress: "border-l-4 border-amber-400 bg-amber-500/5",
    blocked: "border-l-4 border-orange-400 bg-orange-500/5",
    failed: "border-l-4 border-rose-400 bg-rose-500/5",
    not_started: "border-l-4 border-transparent",
  };

  const riskStyles = {
    Low: "text-emerald-300",
    Medium: "text-amber-300",
    High: "text-orange-300",
    Critical: "text-rose-300",
  };

  const severityStyles = {
    Low: "bg-emerald-500/15 text-emerald-300",
    Medium: "bg-amber-500/15 text-amber-300",
    High: "bg-orange-500/15 text-orange-300",
    Critical: "bg-rose-500/15 text-rose-300",
  };

  const readFile = async (file, target) => {
    try {
      const text = await file.text();
      if (target === "phase") setPhaseStatusText(text);
      if (target === "command") setNextCommandText(text);
      setMessage(`Loaded ${file.name}`);
    } catch {
      setMessage(`Failed to load ${file.name}`);
    }
  };

  const handleDrop = async (event, target) => {
    event.preventDefault();
    setDragTarget(null);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await readFile(file, target);
  };

  const handleBrowse = async (event, target) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await readFile(file, target);
    event.target.value = "";
  };

  const exportPdf = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    setMessage("Exporting snapshot to PDF...");
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: "#020617",
        scale: 2,
        useCORS: true,
      });
      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imageData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("orbisvoice-phase-dashboard.pdf");
      setMessage("PDF export complete");
    } catch {
      setMessage("PDF export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const DropZone = ({ title, target, inputRef, children }) => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragTarget(target);
      }}
      onDragLeave={() => setDragTarget((v) => (v === target ? null : v))}
      onDrop={(e) => handleDrop(e, target)}
      className={`rounded-3xl border p-5 shadow-2xl transition ${dragTarget === target ? "border-cyan-400 bg-cyan-500/10" : "border-slate-800 bg-slate-900/70"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" accept=".md,.txt" className="hidden" onChange={(e) => handleBrowse(e, target)} />
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
          >
            Upload file
          </button>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-400">Drag and drop a file here, or upload manually.</div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6" ref={dashboardRef}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">OrbisVoice Phase Dashboard</h1>
            <p className="mt-2 text-slate-300 max-w-3xl">
              Upload or paste <span className="font-mono text-cyan-300">phase-status.md</span> and <span className="font-mono text-cyan-300">next-command.md</span> to render a live operator view.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfig((v) => !v)}
              className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              {showConfig ? "Hide source panels" : "Show source panels"}
            </button>
            <button
              onClick={exportPdf}
              disabled={isExporting}
              className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
            >
              {isExporting ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
          Status: <span className="text-cyan-300">{message}</span>
        </div>

        {showConfig && (
          <div className="grid gap-6 lg:grid-cols-2">
            <DropZone title="phase-status.md" target="phase" inputRef={phaseInputRef}>
              <textarea
                value={phaseStatusText}
                onChange={(e) => setPhaseStatusText(e.target.value)}
                className="mt-4 h-72 w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500"
              />
            </DropZone>
            <DropZone title="next-command.md" target="command" inputRef={commandInputRef}>
              <textarea
                value={nextCommandText}
                onChange={(e) => setNextCommandText(e.target.value)}
                className="mt-4 h-72 w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500"
              />
            </DropZone>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Execution overview</h2>
                <p className="mt-2 text-slate-300 max-w-2xl">Derived directly from your current phase and next-command sources.</p>
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
                <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl ${rowStyles[currentPhase?.status || "not_started"]}`}>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Current phase</div>
            <div className="mt-3 text-2xl font-semibold">{currentPhase ? `Phase ${currentPhase.id}` : "No active phase"}</div>
            <div className="mt-1 text-slate-300">{currentPhase?.name ?? "Update phase-status.md to continue."}</div>
            <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-sm ${statusStyles[currentPhase?.status || "not_started"]}`}>
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
                    <tr key={phase.id} className={`border-t border-slate-800 bg-slate-900/40 hover:bg-slate-800/30 align-top ${rowStyles[phase.status]}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium">Phase {phase.id}</div>
                        <div className="text-slate-300">{phase.name}</div>
                        {phase.objective && <div className="mt-1 text-xs text-slate-500">{phase.objective}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{phase.owner}</td>
                      <td className={`px-4 py-3 font-medium ${riskStyles[phase.risk]}`}>{phase.risk}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusStyles[phase.status]}`}>
                          {phase.status.replaceAll("_", " ")}
                        </span>
                        {phase.notes.length > 0 && <div className="mt-2 text-xs text-slate-400">{phase.notes[0]}</div>}
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
              <div className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-sm text-cyan-300 whitespace-pre-wrap">{commandBody}</div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Open blockers</h2>
                <span className="text-sm text-slate-400">{blockers.length} total</span>
              </div>

              <div className="mt-4 space-y-3">
                {blockers.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">No active blockers found in phase-status.md.</div>
                ) : (
                  blockers.map((blocker, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{blocker.title}</div>
                          <div className="mt-1 text-sm text-slate-400">{blocker.area}</div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs ${severityStyles[blocker.severity] || severityStyles.Medium}`}>{blocker.severity}</span>
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
                  <div className="mt-1 text-xl font-semibold text-amber-300">{phases.filter((p) => p.status === "in_progress").length}</div>
                </div>
                <div className="rounded-2xl bg-slate-800/60 p-4">
                  <div className="text-slate-400 text-sm">Critical Risk Phases</div>
                  <div className="mt-1 text-xl font-semibold text-rose-300">{phases.filter((p) => p.risk === "Critical").length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
