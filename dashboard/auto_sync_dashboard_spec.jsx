import React from "react";

/**
 * Auto Sync Dashboard Spec
 *
 * Purpose:
 * - Read phase-status.md and next-command.md from a local API
 * - Refresh on interval
 * - Fall back to manual paste mode if API is unavailable
 *
 * Expected API endpoints:
 * GET /api/dashboard/phase-status  -> { content: string, updatedAt?: string }
 * GET /api/dashboard/next-command  -> { content: string, updatedAt?: string }
 */
export default function AutoSyncDashboardSpec() {
  const endpoints = [
    { label: "Phase status", path: "/api/dashboard/phase-status" },
    { label: "Next command", path: "/api/dashboard/next-command" },
  ];

  const features = [
    "Poll both endpoints every 10–30 seconds",
    "Show last successful sync time",
    "Show sync status: synced, stale, offline, error",
    "Allow manual refresh",
    "Allow manual paste fallback if API is unavailable",
    "Highlight file parse errors separately from network errors",
    "Keep existing color rules for COMPLETE / IN_PROGRESS / BLOCKED / FAILED",
    "Allow export to PDF after auto-sync refresh",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h1 className="text-3xl font-semibold">Auto-Sync Dashboard</h1>
          <p className="mt-2 text-slate-300">
            This spec defines the auto-sync layer for the OrbisVoice operator dashboard.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold">Required endpoints</h2>
            <div className="mt-4 space-y-3">
              {endpoints.map((item) => (
                <div key={item.path} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-sm text-cyan-300">
                  {item.label}: {item.path}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold">Expected behavior</h2>
            <ul className="mt-4 space-y-2 text-slate-300 list-disc list-inside">
              {features.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold">Recommended implementation</h2>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-sm text-slate-200 whitespace-pre-wrap">
{`// Next.js API route example
// GET /api/dashboard/phase-status
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "phase-status.md");
  const content = await fs.readFile(filePath, "utf8");
  return Response.json({ content, updatedAt: new Date().toISOString() });
}`}
          </div>
        </div>
      </div>
    </div>
  );
}
