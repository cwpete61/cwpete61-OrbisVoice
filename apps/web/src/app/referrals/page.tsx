"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ReferralData {
  code: string;
  shareUrl: string;
}

interface ReferralStats {
  totalReferred: number;
  accepted: number;
  completed: number;
  totalRewards: number;
}

export default function ReferralsPage() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  async function fetchReferralData() {
    try {
      setLoading(true);
      const [codeRes, statsRes] = await Promise.all([
        fetch("/api/users/me/referral-code"),
        fetch("/api/users/me/referral-stats"),
      ]);

      if (!codeRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch referral data");
      }

      const codeData = await codeRes.json();
      const statsData = await statsRes.json();

      setReferralData(codeData.data);
      setStats(statsData.data);
    } catch (err) {
      setError("Failed to load referral data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="text-center py-12">Loading referral program...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-bold text-cyan-400">
            OrbisVoice
          </Link>
          <Link href="/dashboard" className="text-slate-300 hover:text-white">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Referral Program</h1>
        <p className="text-slate-300 mb-12">Earn rewards by inviting others to OrbisVoice</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Referral Code Section */}
          <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-8">
            <h2 className="text-2xl font-bold mb-6">Your Referral Code</h2>

            {referralData && (
              <div>
                <div className="bg-slate-800 rounded-lg p-6 mb-4 font-mono text-center">
                  <div className="text-cyan-400 text-2xl font-bold mb-2">{referralData.code}</div>
                  <div className="text-sm text-slate-400">Share this code with friends</div>
                </div>

                <button
                  onClick={() => copyToClipboard(referralData.code)}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 rounded-lg mb-4 transition"
                >
                  {copied ? "✓ Copied" : "Copy Code"}
                </button>

                <button
                  onClick={() => copyToClipboard(referralData.shareUrl)}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg transition"
                >
                  {copied ? "✓ Copied" : "Copy Share Link"}
                </button>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-8">
            <h2 className="text-2xl font-bold mb-6">Your Stats</h2>

            {stats && (
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Total Referred</div>
                  <div className="text-3xl font-bold text-cyan-400">{stats.totalReferred}</div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Accepted</div>
                  <div className="text-3xl font-bold text-green-400">{stats.accepted}</div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-slate-400 text-sm">Completed</div>
                  <div className="text-3xl font-bold text-purple-400">{stats.completed}</div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 border-t-2 border-slate-600">
                  <div className="text-slate-400 text-sm">Total Rewards</div>
                  <div className="text-3xl font-bold text-amber-400">${stats.totalRewards}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12 bg-slate-700/50 rounded-xl border border-slate-600 p-8">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-cyan-500 text-slate-900 font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold">Share Your Code</h3>
                <p className="text-slate-400">Send your unique referral code to friends and colleagues</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-purple-500 text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold">They Sign Up</h3>
                <p className="text-slate-400">When they join OrbisVoice with your code, they get $10 credit</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-green-500 text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold">You Earn</h3>
                <p className="text-slate-400">You receive $5 for every successful referral</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
