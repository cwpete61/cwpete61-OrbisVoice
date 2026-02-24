"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useTokenFromUrl } from "../../hooks/useTokenFromUrl";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

// ─── Shared helpers ──────────────────────────────────────────────────────────
function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-[#10b981]" : "bg-[#f97316]"}`} />;
}

type BadgeColor = "teal" | "green" | "red" | "orange" | "purple";
function Badge({ children, color = "teal" }: { children: React.ReactNode; color?: BadgeColor }) {
  const colors: Record<BadgeColor, string> = {
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

// ─── Tabs ────────────────────────────────────────────────────────────────────

function OverviewTab({ referralData, stats, copied, onCopy }: any) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Referral link hero */}
      {referralData && (
        <div className="rounded-2xl border border-[#14b8a6]/20 bg-[#14b8a6]/5 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#f0f4fa]">Your Referral Link</h2>
              <p className="mt-1 text-xs text-[rgba(240,244,250,0.5)]">Share this link — you earn a one-time reward when your referral converts to a paid plan.</p>
            </div>
            <div className="flex flex-1 max-w-xl items-center gap-2 rounded-xl border border-white/[0.08] bg-[#05080f] px-4 py-3">
              <span className="flex-1 truncate font-mono text-sm text-[#14b8a6]">{referralData.shareUrl}</span>
              <button onClick={() => onCopy(referralData.shareUrl)}
                className="rounded-lg bg-[#14b8a6]/10 px-3 py-1.5 text-xs font-medium text-[#14b8a6] hover:bg-[#14b8a6]/20 transition whitespace-nowrap">
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0c111d] p-6">
        <h2 className="mb-5 text-sm font-semibold text-[#f0f4fa]">💡 How It Works</h2>
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { icon: "🔗", label: "Share Link", desc: "Send your unique referral URL" },
            { icon: "✍️", label: "They Sign Up", desc: "Friend creates an account" },
            { icon: "💳", label: "They Pay", desc: "Friend upgrades to a paid plan" },
            { icon: "✅", label: "30-Day Hold", desc: "Commission held for refund period" },
            { icon: "🎉", label: "You Get Paid", desc: "One-time reward to your bank" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-2 shrink-0">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center min-w-[110px]">
                <div className="text-xl mb-1">{step.icon}</div>
                <div className="text-xs font-semibold text-[#f0f4fa]">{step.label}</div>
                <div className="text-[10px] text-[rgba(240,244,250,0.4)] mt-0.5 leading-tight">{step.desc}</div>
              </div>
              {i < arr.length - 1 && <span className="text-[rgba(240,244,250,0.2)] text-xl">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Stats + Code */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Code card */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 flex flex-col">
          <h2 className="mb-4 text-sm font-semibold text-[#f0f4fa]">Your Referral Code</h2>
          {referralData ? (
            <>
              <div className="flex-1 flex items-center justify-center rounded-xl border border-white/[0.07] bg-[#05080f] py-6 font-mono">
                <p className="text-2xl font-bold text-[#14b8a6]">{referralData.code}</p>
              </div>
              <button onClick={() => onCopy(referralData.code)}
                className="mt-4 rounded-lg bg-[#14b8a6] px-4 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488] transition">
                {copied ? "✓ Copied" : "Copy Code"}
              </button>
            </>
          ) : (
            <p className="text-sm text-[rgba(240,244,250,0.4)]">No code found.</p>
          )}
        </div>

        {/* Metrics */}
        <div className="col-span-2 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[#f0f4fa]">Performance Metrics</h2>
          {stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "Total Referred", value: stats.totalReferred, fmt: false, color: "#14b8a6" },
                { label: "Accepted", value: stats.accepted, fmt: false, color: "#f0f4fa" },
                { label: "Converted", value: stats.completed, fmt: false, color: "#a78bfa" },
                { label: "Total Earned", value: stats.totalRewards, fmt: true, color: "#f97316" },
                { label: "Available", value: stats.availableRewards, fmt: true, color: "#10b981" },
                { label: "Pending (hold)", value: stats.pendingRewards, fmt: true, color: "#f59e0b" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-white/[0.05] bg-[#05080f] p-4">
                  <span className="text-[10px] uppercase tracking-wider text-[rgba(240,244,250,0.4)]">{s.label}</span>
                  <p className="mt-1.5 text-xl font-bold font-mono" style={{ color: s.color }}>
                    {s.fmt ? `$${Number(s.value).toFixed(2)}` : s.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Activity table */}
      {stats?.referrals?.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] overflow-hidden">
          <div className="p-6 border-b border-white/[0.05]">
            <h2 className="text-sm font-semibold text-[#f0f4fa]">Referral Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111827]/60 text-[rgba(240,244,250,0.4)] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Code Used</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {stats.referrals.map((ref: any) => (
                  <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-[rgba(240,244,250,0.6)]">{new Date(ref.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono text-[#f0f4fa]">{ref.code}</td>
                    <td className="px-6 py-4">
                      <Badge color={ref.status === "completed" ? "green" : "orange"}>{ref.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[#14b8a6]">+${ref.rewardAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function BankingTab({ stripeDetails, stripeStatus, loginLinkLoading, onGetLoginLink, onConnect }: any) {
  const isActive = stripeDetails?.payoutsEnabled || stripeStatus?.status === "active";
  const needsAction = stripeDetails?.requirementsDue?.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-[#f0f4fa] mb-1">Stripe Connect</h2>
            <p className="text-sm text-[rgba(240,244,250,0.5)] max-w-lg">
              Connect your bank account to receive your referral rewards automatically when they become available. Powered by Stripe Express.
            </p>
          </div>
          <div className="shrink-0">
            {isActive ? (
              <button onClick={onGetLoginLink} disabled={loginLinkLoading}
                className="flex items-center gap-2 rounded-lg bg-[#635BFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#524ae3] transition disabled:opacity-50 shadow-lg shadow-[#635BFF]/20">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                {loginLinkLoading ? "Opening…" : "Open Stripe Dashboard"}
              </button>
            ) : (
              <button onClick={onConnect}
                className="rounded-lg bg-[#635BFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#524ae3] transition shadow-lg shadow-[#635BFF]/20">
                Connect with Stripe
              </button>
            )}
          </div>
        </div>

        {/* Status grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Details Submitted", ok: stripeDetails?.detailsSubmitted ?? false },
            { label: "Charges Enabled", ok: stripeDetails?.chargesEnabled ?? false },
            { label: "Payouts Enabled", ok: stripeDetails?.payoutsEnabled ?? false },
            { label: "Payout Schedule", value: stripeDetails?.payoutSchedule || (stripeStatus?.status === "not_connected" ? "Not set" : "—") },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/[0.05] bg-[#111827] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[rgba(240,244,250,0.4)] mb-2">{item.label}</p>
              {"value" in item ? (
                <p className="text-sm font-semibold text-[#f0f4fa]">{item.value}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <StatusDot ok={item.ok} />
                  <span className="text-sm font-semibold text-[#f0f4fa]">{item.ok ? "Yes" : "No"}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {needsAction && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <p className="text-sm font-semibold text-orange-400">Action Required</p>
              <p className="mt-1 text-xs text-orange-300/70">Stripe needs: {stripeDetails.requirementsDue.join(", ")}</p>
            </div>
          </div>
        )}

        {/* Connected balance */}
        {stripeDetails?.liveDataAvailable && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.05] bg-[#111827] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[rgba(240,244,250,0.4)] mb-1">Stripe Available</p>
              <p className="text-2xl font-bold font-mono text-[#10b981]">${(stripeDetails.connectedBalance?.available ?? 0).toFixed(2)}</p>
              <p className="text-[10px] text-[rgba(240,244,250,0.3)] mt-1">Ready to pay out to bank</p>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-[#111827] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[rgba(240,244,250,0.4)] mb-1">Stripe Pending</p>
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
              {payouts.length > 0 ? payouts.map((p: any) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-[rgba(240,244,250,0.6)]">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-mono text-[rgba(240,244,250,0.7)]">${p.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono text-[#f97316]">-${(p.feeAmount ?? 0).toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono font-bold text-[#14b8a6]">${(p.netAmount ?? p.amount).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    {p.transactionId && p.transactionId !== "simulated" ? (
                      <a href={`https://dashboard.stripe.com/test/transfers/${p.transactionId}`} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-[10px] text-[#635BFF] hover:underline">{p.transactionId.slice(0, 18)}…</a>
                    ) : (
                      <span className="font-mono text-[10px] text-[rgba(240,244,250,0.3)]">{p.transactionId || "—"}</span>
                    )}
                  </td>
                  <td className="px-6 py-4"><Badge color="green">{p.status}</Badge></td>
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

function TaxTab({ taxStatus, formData, setFormData, onSave, saving, saveMsg, saveErr }: any) {
  const ytd = taxStatus?.ytdEarnings ?? 0;
  const threshold = taxStatus?.thresholdAmount ?? 600;
  const pct = Math.min((ytd / threshold) * 100, 100);
  const crossed = taxStatus?.thresholdCrossed;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* IRS threshold tracker */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6">
        <h2 className="text-lg font-semibold text-[#f0f4fa] mb-1">IRS Compliance Status</h2>
        <p className="text-sm text-[rgba(240,244,250,0.5)] mb-6">Partners earning $600+ per year receive a 1099-NEC tax form from OrbisVoice.</p>
        <div className="flex justify-between mb-2">
          <span className="text-xs font-semibold text-[rgba(240,244,250,0.6)]">YTD Referral Earnings</span>
          <span className="text-sm font-bold font-mono text-[#f0f4fa]">${ytd.toFixed(2)} / ${threshold}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/[0.05] overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${crossed ? "bg-[#f97316]" : "bg-[#14b8a6]"}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <StatusDot ok={taxStatus?.taxFormCompleted} />
            <span className="text-xs text-[rgba(240,244,250,0.6)]">Tax info submitted</span>
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
              <p className="mt-1 text-xs text-orange-300/70">You've exceeded the $600 IRS threshold. Please fill out the form below to stay compliant.</p>
            </div>
          </div>
        )}
      </div>

      {/* Tax info form */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0c111d] p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-[#f0f4fa] mb-1">Tax & Identification</h2>
        <p className="text-sm text-[rgba(240,244,250,0.5)] mb-6">Required for 1099-NEC reporting. Stored securely, shared only with IRS as required.</p>
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
                <input type="text" value={(formData as any)[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
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
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.5)]">State</label>
              <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white focus:border-[#14b8a6] outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.5)]">TIN / SSN (last 4)</label>
            <input type="text" value={formData.tinSsn} onChange={(e) => setFormData({ ...formData, tinSsn: e.target.value })}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white focus:border-[#14b8a6] outline-none" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-[#14b8a6] px-6 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488] disabled:opacity-50 transition">
              {saving ? "Saving…" : "Save Tax Information"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
function ReferralsContent() {
  const [profile, setProfile] = useState<any>(null);
  const [referralData, setReferralData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Stripe
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [stripeDetails, setStripeDetails] = useState<any>(null);
  const [loginLinkLoading, setLoginLinkLoading] = useState(false);

  // Payouts / tax
  const [payouts, setPayouts] = useState<any[]>([]);
  const [taxStatus, setTaxStatus] = useState<any>(null);

  // Form
  const [formData, setFormData] = useState({ firstName: "", lastName: "", businessName: "", phone: "", address: "", unit: "", city: "", state: "", zip: "", tinSsn: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const tokenLoaded = useTokenFromUrl();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    const h = { Authorization: `Bearer ${token}` };

    try {
      const [profileRes, codeRes, statsRes, stripeRes, stripeDetailsRes, payoutsRes, taxRes] = await Promise.all([
        fetch(`${API_BASE}/users/me`, { headers: h }),
        fetch(`${API_BASE}/users/me/referral-code`, { headers: h }),
        fetch(`${API_BASE}/users/me/referral-stats`, { headers: h }),
        fetch(`${API_BASE}/affiliates/stripe/status`, { headers: h }),
        fetch(`${API_BASE}/affiliates/stripe/account-details`, { headers: h }),
        fetch(`${API_BASE}/affiliates/me/payouts`, { headers: h }),
        fetch(`${API_BASE}/affiliates/me/tax-status`, { headers: h }),
      ]);

      if (profileRes.ok) {
        const d = await profileRes.json();
        setProfile(d.data);
        setFormData({ firstName: d.data.firstName || "", lastName: d.data.lastName || "", businessName: d.data.businessName || "", phone: d.data.phone || "", address: d.data.address || "", unit: d.data.unit || "", city: d.data.city || "", state: d.data.state || "", zip: d.data.zip || "", tinSsn: d.data.tinSsn || "" });
      }
      if (codeRes.ok) setReferralData((await codeRes.json()).data);
      if (statsRes.ok) setStats((await statsRes.json()).data);
      if (stripeRes.ok) setStripeStatus((await stripeRes.json()).data);
      if (stripeDetailsRes.ok) setStripeDetails((await stripeDetailsRes.json()).data);
      if (payoutsRes.ok) setPayouts((await payoutsRes.json()).data ?? []);
      if (taxRes.ok) setTaxStatus((await taxRes.json()).data);
    } catch (err: any) {
      setError(err.message || "Failed to load referral data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (tokenLoaded) fetchData(); }, [tokenLoaded, fetchData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/affiliates/stripe/onboard`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (res.ok && data.data?.url) window.location.href = data.data.url;
    else alert(data.message || "Failed to start Stripe onboarding");
  };

  const handleGetLoginLink = async () => {
    setLoginLinkLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/affiliates/stripe/login-link`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.data?.url) window.open(data.data.url, "_blank", "noopener,noreferrer");
      else alert(data.message || "Could not open Stripe Dashboard");
    } finally {
      setLoginLinkLoading(false);
    }
  };

  const handleSaveTaxInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(null); setSaveErr(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/me`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setSaveMsg("Tax information saved successfully.");
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

  // Redirect affiliates to the full Partner Portal
  if (stats?.isAffiliate) {
    return (
      <DashboardShell tokenLoaded={tokenLoaded}>
        <div className="mx-auto max-w-2xl px-8 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#14b8a6]/10 text-3xl">🚀</div>
          <h2 className="text-xl font-bold text-[#f0f4fa]">Professional Partner Detected</h2>
          <p className="mt-2 text-sm text-[rgba(240,244,250,0.4)]">Use your dedicated Partner Portal for full earnings management.</p>
          <Link href="/affiliates" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#14b8a6] px-6 py-2.5 text-sm font-semibold text-[#05080f] hover:bg-[#0d9488] transition">
            Go to Partner Portal →
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const isStripeActive = stripeDetails?.payoutsEnabled || stripeStatus?.status === "active";

  const TABS = [
    { id: "overview", label: "Overview & Stats" },
    { id: "banking", label: "Banking & Payouts" },
    { id: "payout-history", label: "Payout History" },
    { id: "tax", label: "Tax & Compliance" },
  ];

  return (
    <DashboardShell tokenLoaded={tokenLoaded}>
      <div className="px-6 lg:px-8 py-8">
        {/* Stripe return banners */}
        {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("stripe_return") === "true" && (
          <div className="mb-6 rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 px-4 py-3 text-sm text-[#10b981]">
            Welcome back from Stripe! Your account status is updating.
          </div>
        )}
        {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("stripe_refresh") === "true" && (
          <div className="mb-6 rounded-lg border border-[#f97316]/30 bg-[#f97316]/10 px-4 py-3 text-sm text-[#f97316]">
            Your Stripe session expired. Please try again.
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f4fa]">Referral Program</h1>
            <p className="mt-1 text-sm text-[rgba(240,244,250,0.5)]">Earn a one-time reward for every person you refer who becomes a paying customer.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-white hover:bg-white/[0.08] transition">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
            <Badge color={isStripeActive ? "green" : "orange"}>
              <StatusDot ok={isStripeActive} />
              {isStripeActive ? "Payouts Active" : "Banking Not Set Up"}
            </Badge>
            {taxStatus?.thresholdCrossed && !taxStatus?.taxFormCompleted && (
              <Badge color="red">⚠ Tax Required</Badge>
            )}
          </div>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

        {/* Tab nav */}
        <div className="mb-8 flex gap-0.5 overflow-x-auto border-b border-white/[0.06] pb-px">
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
              {tab.id === "banking" && !isStripeActive && (
                <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "overview" && <OverviewTab referralData={referralData} stats={stats} copied={copied} onCopy={copyToClipboard} />}
        {activeTab === "banking" && (
          <BankingTab stripeDetails={stripeDetails} stripeStatus={stripeStatus}
            loginLinkLoading={loginLinkLoading} onGetLoginLink={handleGetLoginLink} onConnect={handleConnect} />
        )}
        {activeTab === "payout-history" && <PayoutHistoryTab payouts={payouts} />}
        {activeTab === "tax" && (
          <TaxTab taxStatus={taxStatus} formData={formData} setFormData={setFormData}
            onSave={handleSaveTaxInfo} saving={saving} saveMsg={saveMsg} saveErr={saveErr} />
        )}
      </div>
    </DashboardShell>
  );
}

export default function ReferralsPage() {
  return (
    <Suspense>
      <ReferralsContent />
    </Suspense>
  );
}