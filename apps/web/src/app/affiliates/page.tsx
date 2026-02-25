"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";
import { API_BASE } from "@/lib/api";

// ─── Helper ────────────────────────────────────────────────────────────────
function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-[#10b981]" : "bg-[#f97316]"}`} />;
}

function Badge({ children, color = "teal" }: { children: React.ReactNode; color?: "teal" | "green" | "red" | "orange" | "purple" }) {
  const colors: Record<string, string> = {
    teal: "bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors[color]}`}>
      {children}
    </span>
  );
}

const getExpectedPayoutDate = (createdAt: string) => {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + 30); // 30-day hold

  // Find next bi-monthly window (15th or Last Day)
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  if (day <= 15) {
    return new Date(year, month, 15).toLocaleDateString();
  } else {
    return new Date(year, month + 1, 0).toLocaleDateString();
  }
};

// ─── Sub-components ─────────────────────────────────────────────────────────
function OverviewTab({ stats, commissionRate, profile }: any) {
  const copyLink = () => {
    navigator.clipboard.writeText(stats?.shareUrl || "");
    alert("Referral link copied!");
  };

  const metrics = [
    { label: "Total Referred", value: stats?.totalReferred ?? 0, highlight: false },
    { label: "Accepted", value: stats?.accepted ?? 0, highlight: false },
    { label: "Converted", value: stats?.completed ?? 0, highlight: false },
    { label: "Total Earned", value: `$${(stats?.totalRewards ?? 0).toFixed(2)}`, highlight: false, mono: true },
    { label: "Available", value: `$${(stats?.availableRewards ?? 0).toFixed(2)}`, highlight: true, mono: true },
    {
      label: "Pending (Hold)",
      value: `$${(stats?.pendingRewards ?? 0).toFixed(2)}`,
      highlight: false,
      dim: true,
      mono: true,
      desc: stats?.referrals?.some((r: any) => (r.status === 'completed' || r.status === 'pending') && r.rewardAmount > 0)
        ? `Est. Payday: ${getExpectedPayoutDate(stats.referrals.find((r: any) => (r.status === 'completed' || r.status === 'pending') && r.rewardAmount > 0).createdAt)}`
        : "30-day verification"
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Performance Metrics Section */}
      <section>
        <h3 className="text-xs uppercase tracking-[0.2em] font-black text-[rgba(240,244,250,0.4)] mb-6 flex items-center gap-2">
          <span className="h-px w-6 bg-white/10"></span>
          Performance Metrics
        </h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-[#0c111d] p-5 hover:border-white/[0.12] transition-all">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.4)] mb-2">{m.label}</p>
              <p className={`text-2xl font-bold ${m.highlight ? "text-[#14b8a6]" : m.dim ? "text-[rgba(240,244,250,0.4)]" : "text-[#f0f4fa]"} ${m.mono ? "font-mono text-xl" : ""}`}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Earnings Pipeline - MOVED HERE */}
      <section>
        <h3 className="text-xs uppercase tracking-[0.2em] font-black text-[rgba(240,244,250,0.4)] mb-6 flex items-center gap-2">
          <span className="h-px w-6 bg-white/10"></span>
          Earnings Pipeline
        </h3>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c111d] p-6">
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { label: "Customer Pays", icon: "💳", desc: "Referral commission created", color: "border-purple-500/30 bg-purple-500/5" },
              { label: "30-Day Hold", icon: "⏳", desc: "Refund protection period", color: "border-orange-500/30 bg-orange-500/5" },
              { label: "Available", icon: "✅", desc: "Ready for payout queue", color: "border-[#14b8a6]/30 bg-[#14b8a6]/5" },
              { label: "Transfer", icon: "🏦", desc: "Sent to your Stripe account", color: "border-green-500/30 bg-green-500/5" },
              { label: "Bank Deposit", icon: "🎉", desc: "Lands in your bank account", color: "border-blue-500/30 bg-blue-500/5" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2 shrink-0">
                <div className={`rounded-xl border ${step.color} p-4 text-center min-w-[120px]`}>
                  <div className="text-2xl mb-1">{step.icon}</div>
                  <div className="text-xs font-semibold text-[#f0f4fa]">{step.label}</div>
                  <div className="text-[10px] text-[rgba(240,244,250,0.4)] mt-0.5">{step.desc}</div>
                </div>
                {i < arr.length - 1 && <span className="text-[rgba(240,244,250,0.2)] text-xl">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Activity Table - Restored portion of the image */}
      <section>
        <h3 className="text-xs uppercase tracking-[0.2em] font-black text-[rgba(240,244,250,0.4)] mb-6 flex items-center gap-2">
          <span className="h-px w-6 bg-white/10"></span>
          Referral Activity
        </h3>
        <div className="rounded-3xl border border-white/[0.07] bg-[#0c111d] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111827]/80 text-[rgba(240,244,250,0.4)] uppercase tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Code Used</th>
                  <th className="px-6 py-4">User & Email</th>
                  <th className="px-6 py-4 text-center">Plan</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 group/tip relative">
                      Expected Payout
                      <svg className="h-3 w-3 text-[rgba(240,244,250,0.3)] cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-3 rounded-xl bg-[#05080f] border border-white/10 text-[10px] normal-case font-medium text-[rgba(240,244,250,0.6)] opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
                        Funds are released to your bank in the next available bi-monthly window (15th or end of month) after the 30-day verification hold expires.
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {!stats?.referrals || stats.referrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-[rgba(240,244,250,0.3)] font-medium">
                      No referral activity found yet. Start sharing your link to earn!
                    </td>
                  </tr>
                ) : (
                  stats.referrals.map((ref: any) => (
                    <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5 text-[rgba(240,244,250,0.5)] whitespace-nowrap">{new Date(ref.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-5 text-[rgba(240,244,250,0.6)] font-mono text-[10px]">{ref.referralCodeUsed || "—"}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.05] flex items-center justify-center text-[10px] font-bold text-[#f0f4fa]">
                            {ref.name?.charAt(0) || "U"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[#f0f4fa] font-semibold">{ref.name || "Unknown User"}</span>
                            <span className="text-[10px] text-[rgba(240,244,250,0.4)]">{ref.email || "No email"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <Badge color={ref.plan === 'free' ? 'teal' : 'purple'}>{ref.plan}</Badge>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <Badge color={ref.status === "completed" ? "green" : "orange"}>{ref.status}</Badge>
                      </td>
                      <td className="px-6 py-5 text-center text-[10px] font-medium text-[rgba(240,244,250,0.4)]">
                        {getExpectedPayoutDate(ref.createdAt)}
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-[#14b8a6] whitespace-nowrap">
                        +${(ref.rewardAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Commission rate + referral link */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c111d] p-6">
          <h2 className="mb-1 text-sm font-semibold text-[#f0f4fa]">Your Commission Rate</h2>
          <p className="text-4xl font-bold text-[#14b8a6]">{commissionRate}%</p>
          <p className="mt-2 text-xs text-[rgba(240,244,250,0.4)]">Per referred customer's first qualifying payment</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c111d] p-6">
          <h2 className="mb-3 text-sm font-semibold text-[#f0f4fa]">Your Partner Link</h2>
          <div className="flex gap-2">
            <input readOnly value={stats?.shareUrl || "Loading…"} className="flex-1 rounded-lg border border-white/[0.08] bg-[#05080f] px-3 py-2.5 text-sm text-[rgba(240,244,250,0.7)] outline-none truncate" />
            <button onClick={copyLink} className="rounded-lg bg-[#14b8a6] px-4 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488] transition active:scale-95 shrink-0">
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BankingTab({ stripeDetails, loginLinkLoading, onGetLoginLink, onReconnect, stripeStatus }: any) {
  const isActive = stripeDetails?.connected && stripeDetails?.payoutsEnabled;
  const needsAction = stripeDetails?.requirementsDue?.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stripe Connect Status Card */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-[#f0f4fa] mb-1">Stripe Connect</h2>
            <p className="text-sm text-[rgba(240,244,250,0.5)] max-w-lg">
              Your bank account is connected via Stripe Express. Payouts go from OrbisVoice's platform to your Stripe account, then to your bank on your configured schedule.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            {isActive && (
              <button
                onClick={onGetLoginLink}
                disabled={loginLinkLoading}
                className="flex items-center gap-2 rounded-lg bg-[#635BFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#524ae3] transition disabled:opacity-50 shadow-lg shadow-[#635BFF]/20"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                {loginLinkLoading ? "Opening…" : "Open Stripe Dashboard"}
              </button>
            )}
            {!isActive && (
              <button onClick={onReconnect} className="rounded-lg bg-[#635BFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#524ae3] transition shadow-lg shadow-[#635BFF]/20">
                {stripeStatus?.status === "not_connected" ? "Connect Bank Account" : "Complete Onboarding"}
              </button>
            )}
          </div>
        </div>

        {/* Status Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Details Submitted", ok: stripeDetails?.detailsSubmitted },
            { label: "Charges Enabled", ok: stripeDetails?.chargesEnabled },
            { label: "Payouts Enabled", ok: stripeDetails?.payoutsEnabled },
            { label: "Payout Schedule", value: stripeDetails?.payoutSchedule || "Not set" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/[0.05] bg-[#111827] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[rgba(240,244,250,0.4)] mb-2">{item.label}</p>
              {item.value !== undefined ? (
                <p className="text-sm font-semibold text-[#f0f4fa]">{item.value}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <StatusDot ok={item.ok ?? false} />
                  <span className="text-sm font-semibold text-[#f0f4fa]">{item.ok ? "Yes" : "No"}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Requirements due warning */}
        {needsAction && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <p className="text-sm font-semibold text-orange-400">Action Required</p>
              <p className="mt-1 text-xs text-orange-300/70">Stripe needs additional information: {stripeDetails.requirementsDue.join(", ")}</p>
            </div>
          </div>
        )}

        {/* Connected balance */}
        {stripeDetails?.liveDataAvailable && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.05] bg-[#111827] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[rgba(240,244,250,0.4)] mb-1">Your Stripe Available</p>
              <p className="text-2xl font-bold font-mono text-[#10b981]">${(stripeDetails.connectedBalance?.available ?? 0).toFixed(2)}</p>
              <p className="text-[10px] text-[rgba(240,244,250,0.3)] mt-1">Ready to pay out to bank</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-[#111827] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[rgba(240,244,250,0.4)] mb-1">Your Stripe Pending</p>
              <p className="text-2xl font-bold font-mono text-[rgba(240,244,250,0.5)]">${(stripeDetails.connectedBalance?.pending ?? 0).toFixed(2)}</p>
              <p className="text-[10px] text-[rgba(240,244,250,0.3)] mt-1">In Stripe settlement</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PayoutHistoryTab({ payouts }: { payouts: any[] }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] overflow-hidden">
        <div className="p-6 border-b border-white/[0.05]">
          <h2 className="text-lg font-semibold text-[#f0f4fa]">Payout History</h2>
          <p className="text-sm text-[rgba(240,244,250,0.5)] mt-1">Confirmed transfers from OrbisVoice to your Stripe account.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111827]/60 text-[rgba(240,244,250,0.4)] text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Gross</th>
                <th className="px-6 py-4">Fee</th>
                <th className="px-6 py-4">Net Transferred</th>
                <th className="px-6 py-4">Stripe Transfer ID</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {payouts.length > 0 ? payouts.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-[rgba(240,244,250,0.6)]">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-[rgba(240,244,250,0.7)]">${p.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-[#f97316]">-${(p.feeAmount ?? 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-[#14b8a6]">${(p.netAmount ?? p.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {p.transactionId && p.transactionId !== "simulated" ? (
                      <a href={`https://dashboard.stripe.com/test/transfers/${p.transactionId}`} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-[10px] text-[#635BFF] hover:underline">{p.transactionId.slice(0, 18)}…</a>
                    ) : (
                      <span className="font-mono text-[10px] text-[rgba(240,244,250,0.3)]">{p.transactionId || "—"}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge color="green">{p.status}</Badge>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[rgba(240,244,250,0.3)]">No payouts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TaxComplianceTab({ taxStatus, formData, setFormData, onSave, saving, saveMsg, saveErr }: any) {
  const ytd = taxStatus?.ytdEarnings ?? 0;
  const threshold = taxStatus?.thresholdAmount ?? 600;
  const pct = Math.min((ytd / threshold) * 100, 100);
  const crossed = taxStatus?.thresholdCrossed;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* YTD earning vs $600 threshold */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
        <h2 className="text-lg font-semibold text-[#f0f4fa] mb-1">IRS Compliance Status</h2>
        <p className="text-sm text-[rgba(240,244,250,0.5)] mb-6">The IRS requires a 1099-NEC for any partner earning $600+ in a calendar year.</p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[rgba(240,244,250,0.6)]">YTD Earnings</span>
          <span className="text-sm font-bold font-mono text-[#f0f4fa]">${ytd.toFixed(2)} / ${threshold}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/[0.05] overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${crossed ? "bg-[#f97316]" : "bg-[#14b8a6]"}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <StatusDot ok={taxStatus?.taxFormCompleted} />
            <span className="text-xs text-[rgba(240,244,250,0.6)]">W-9 / Tax form submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot ok={(taxStatus?.availableTaxForms ?? 0) > 0} />
            <span className="text-xs text-[rgba(240,244,250,0.6)]">{taxStatus?.availableTaxForms ?? 0} 1099 form(s) available</span>
          </div>
        </div>
        {crossed && !taxStatus?.taxFormCompleted && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
            <span className="text-orange-400 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-orange-400">Action Required: Submit Tax Information</p>
              <p className="mt-1 text-xs text-orange-300/70">You've exceeded the $600 IRS reporting threshold. Complete the tax form below to prevent payout holds.</p>
            </div>
          </div>
        )}
        {taxStatus?.taxForms?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-[rgba(240,244,250,0.5)] mb-2">Available Tax Documents:</p>
            <div className="space-y-2">
              {taxStatus.taxForms.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-[#111827] px-4 py-2.5">
                  <span className="text-sm text-[#f0f4fa]">{f.type} — {f.year}</span>
                  <Badge color={f.status === "available" ? "green" : "orange"}>{f.status}</Badge>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[rgba(240,244,250,0.4)]">
              Access and download your 1099 from your{" "}
              <span className="text-[#635BFF]">Stripe Express Dashboard</span>{" "}
              (Payouts & Banking tab → Open Stripe Dashboard).
            </p>
          </div>
        )}
      </div>

      {/* Tax info form */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-[#f0f4fa] mb-1">Tax & Identification Information</h2>
        <p className="text-sm text-[rgba(240,244,250,0.5)] mb-6">Required for 1099-NEC compliance. Stored securely, used only for tax reporting.</p>
        {saveErr && <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{saveErr}</div>}
        {saveMsg && <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">{saveMsg}</div>}
        <form onSubmit={onSave} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { key: "firstName", label: "First Name" },
              { key: "lastName", label: "Last Name" },
              { key: "businessName", label: "Business Name (optional)" },
              { key: "phone", label: "Phone" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.5)]">{label}</label>
                <input type="text" value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white focus:border-[#14b8a6] outline-none" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-4 sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.5)]">Street Address</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white focus:border-[#14b8a6] outline-none" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.5)]">City</label>
              <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white focus:border-[#14b8a6] outline-none" />
            </div>
            <div className="col-span-1">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.5)]">State</label>
              <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white focus:border-[#14b8a6] outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.5)]">TIN / SSN (last 4 for verification)</label>
            <input type="text" value={formData.tinSsn} onChange={(e) => setFormData({ ...formData, tinSsn: e.target.value })}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white focus:border-[#14b8a6] outline-none" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-[#14b8a6] px-6 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488] disabled:opacity-50 transition">
              {saving ? "Saving…" : "Save Tax Information"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransactionsTab({ stats }: any) {
  const txs: any[] = stats?.transactions ?? [];
  const statusColor: Record<string, string> = {
    pending: "orange",
    available: "teal",
    paid: "green",
    refunded: "red",
  };
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] overflow-hidden">
        <div className="p-6 border-b border-white/[0.05]">
          <h2 className="text-lg font-semibold text-[#f0f4fa]">Commission Transactions</h2>
          <p className="text-sm text-[rgba(240,244,250,0.5)] mt-1">Individual commission events from your referrals.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111827]/60 text-[rgba(240,244,250,0.4)] text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4">Hold Until</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {txs.length > 0 ? txs.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-[rgba(240,244,250,0.6)]">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-[rgba(240,244,250,0.7)] font-mono text-[10px]">
                    {tx.sourcePaymentId?.slice(0, 16)}…
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-[#14b8a6]">${tx.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-[rgba(240,244,250,0.4)]">
                    {tx.holdEndsAt ? new Date(tx.holdEndsAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={(statusColor[tx.status] ?? "teal") as any}>{tx.status}</Badge>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-[rgba(240,244,250,0.3)]">No transactions yet. Share your link to start earning!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
function AffiliateDashboardContent() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [stripeDetails, setStripeDetails] = useState<any>(null);
  const [commissionRate, setCommissionRate] = useState<number>(30);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [taxStatus, setTaxStatus] = useState<any>(null);
  const [payoutEligibility, setPayoutEligibility] = useState<any>(null);
  const [loginLinkLoading, setLoginLinkLoading] = useState(false);

  const [formData, setFormData] = useState({ firstName: "", lastName: "", businessName: "", phone: "", address: "", city: "", state: "", zip: "", tinSsn: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const tokenLoaded = useTokenFromUrl();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    try {
      const [profileRes, statsRes, stripeRes, programRes, payoutsRes, stripeDetailsRes, taxRes, eligRes] = await Promise.all([
        fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/affiliates/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/affiliates/stripe/status`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/affiliates/program-details`),
        fetch(`${API_BASE}/affiliates/me/payouts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/affiliates/stripe/account-details`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/affiliates/me/tax-status`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/affiliates/me/payout-eligibility`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (profileRes.ok) {
        const d = await profileRes.json();
        setProfile(d.data);
        setFormData({
          firstName: d.data.firstName || "", lastName: d.data.lastName || "",
          businessName: d.data.businessName || "", phone: d.data.phone || "",
          address: d.data.address || "", city: d.data.city || "",
          state: d.data.state || "", zip: d.data.zip || "",
          tinSsn: d.data.tinSsn || "",
        });
      }
      if (statsRes.ok) setStats((await statsRes.json()).data);
      if (stripeRes.ok) setStripeStatus((await stripeRes.json()).data);
      if (programRes.ok) setCommissionRate((await programRes.json()).data?.commissionRate ?? 30);
      if (payoutsRes.ok) setPayouts((await payoutsRes.json()).data ?? []);
      if (stripeDetailsRes.ok) setStripeDetails((await stripeDetailsRes.json()).data);
      if (taxRes.ok) setTaxStatus((await taxRes.json()).data);
      if (eligRes.ok) setPayoutEligibility((await eligRes.json()).data);
    } catch (err) {
      console.error("Failed to load partner portal data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenLoaded) fetchData();
  }, [tokenLoaded, fetchData]);

  const handleGetLoginLink = async () => {
    setLoginLinkLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/affiliates/stripe/login-link`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.data?.url) {
        window.open(data.data.url, "_blank", "noopener,noreferrer");
      } else {
        alert(data.message || "Failed to open Stripe Dashboard");
      }
    } finally {
      setLoginLinkLoading(false);
    }
  };

  const handleStripeOnboard = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/affiliates/stripe/onboard`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (res.ok && data.data?.url) window.location.href = data.data.url;
    else alert(data.message || "Failed to generate onboarding link.");
  };

  const handleSaveTaxInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(null); setSaveErr(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/me`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setSaveMsg("Tax information saved.");
    } catch (err: any) {
      setSaveErr(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
        </div>
      </DashboardShell>
    );
  }

  if (profile && !profile.isAffiliate && !profile.isAdmin) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="flex h-screen flex-col items-center justify-center text-center px-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#14b8a6]/10 text-3xl">🔒</div>
          <h2 className="text-xl font-bold text-[#f0f4fa]">Partner Access Required</h2>
          <p className="mt-2 text-sm text-[rgba(240,244,250,0.5)]">This portal is for approved OrbisVoice partners.</p>
          <a href="/partner/apply" className="mt-6 rounded-lg bg-[#14b8a6] px-5 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488]">Apply for Partner Program</a>
        </div>
      </DashboardShell>
    );
  }

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "banking", label: "Payouts & Banking" },
    { id: "payout-history", label: "Payout History" },
    { id: "tax", label: "Tax & Compliance" },
    { id: "transactions", label: "Transactions" },
  ];

  const isStripeActive = stripeStatus?.status === "active" || stripeDetails?.payoutsEnabled;

  return (
    <DashboardShell tokenLoaded={tokenLoaded}>
      <div className="px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f4fa]">Partner Portal</h1>
            <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Manage your earnings, banking, and compliance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white hover:bg-white/[0.08] transition">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
            <Badge color={isStripeActive ? "green" : "orange"}>
              <StatusDot ok={isStripeActive} />
              {isStripeActive ? "Payouts Active" : "Setup Incomplete"}
            </Badge>
            {taxStatus?.thresholdCrossed && !taxStatus?.taxFormCompleted && (
              <Badge color="red">⚠ Tax Action Required</Badge>
            )}
          </div>
        </div>

        {/* Payout Hold Banner */}
        {payoutEligibility?.payoutHeld && (
          <div className="mb-6 flex items-start gap-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
            <div className="shrink-0 text-2xl">🔒</div>
            <div className="flex-1">
              <p className="font-semibold text-orange-300">Payouts are currently on hold</p>
              <p className="mt-1 text-sm text-orange-300/70">
                {payoutEligibility.holdReason === "tax_hold"
                  ? `Your YTD earnings have reached $${payoutEligibility.ytdPaid?.toFixed(2)} — the IRS $600 threshold. Please complete your tax documentation to resume payouts.`
                  : "An admin has placed a hold on your payouts. Please contact support for details."}
              </p>
              {payoutEligibility.requiredActions?.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {payoutEligibility.requiredActions.map((action: string) => (
                    <li key={action} className="flex items-center gap-2 text-xs text-orange-300/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                      {action}
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => setActiveTab("tax")}
                className="mt-3 rounded-lg bg-orange-500/20 border border-orange-500/30 px-4 py-1.5 text-xs font-semibold text-orange-300 hover:bg-orange-500/30 transition">
                Go to Tax & Compliance →
              </button>
            </div>
          </div>
        )}

        {/* Tab nav */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4 border-b border-white/[0.06] pb-px">
          <div className="flex gap-0.5 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id
                  ? "border-[#14b8a6] text-[#14b8a6]"
                  : "border-transparent text-[rgba(240,244,250,0.5)] hover:text-[#f0f4fa]"
                  }`}>
                {tab.label}
                {tab.id === "tax" && taxStatus?.thresholdCrossed && !taxStatus?.taxFormCompleted && (
                  <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                )}
              </button>
            ))}
          </div>

          {(stats?.referrals?.some((r: any) => (r.status === 'completed' || r.status === 'pending') && r.rewardAmount > 0)) && (
            <div className="bg-red-500/10 border border-red-500/20 px-5 py-3 rounded-2xl text-[20px] font-black text-white animate-pulse tracking-tight shadow-lg shadow-red-500/5 pr-4 pb-2">
              Next Payout: {getExpectedPayoutDate(stats.referrals.find((r: any) => (r.status === 'completed' || r.status === 'pending') && r.rewardAmount > 0).createdAt)}
            </div>
          )}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <OverviewTab stats={stats} commissionRate={commissionRate} profile={profile} />}
        {activeTab === "banking" && (
          <BankingTab
            stripeDetails={stripeDetails}
            stripeStatus={stripeStatus}
            loginLinkLoading={loginLinkLoading}
            onGetLoginLink={handleGetLoginLink}
            onReconnect={handleStripeOnboard}
          />
        )}
        {activeTab === "payout-history" && <PayoutHistoryTab payouts={payouts} />}
        {activeTab === "tax" && (
          <TaxComplianceTab
            taxStatus={taxStatus}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveTaxInfo}
            saving={saving}
            saveMsg={saveMsg}
            saveErr={saveErr}
          />
        )}
        {activeTab === "transactions" && <TransactionsTab stats={stats} />}
      </div>
    </DashboardShell>
  );
}

export default function AffiliatePage() {
  return (
    <Suspense>
      <AffiliateDashboardContent />
    </Suspense>
  );
}