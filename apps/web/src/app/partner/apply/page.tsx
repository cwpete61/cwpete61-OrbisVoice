"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicNav from "../../components/PublicNav";
import PasswordInput from "../../components/PasswordInput";
import { API_BASE } from "@/lib/api";

export default function PartnerApplication() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [success, setSuccess] = useState(false);
    const [verificationRequired, setVerificationRequired] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
            setError("Only @gmail.com accounts are allowed at this time.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/affiliates/public-apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Something went wrong creating application.");
            }

            // Handle success
            if (data.data?.verificationRequired) {
                setVerificationRequired(true);
                setSuccess(true);
            } else {
                // If success and no verification needed, user token is returned
                if (data.data?.token) {
                    localStorage.setItem("token", data.data.token);
                }
                router.push("/affiliates?welcome=true");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success && verificationRequired) {
        return (
            <div className="flex min-h-screen flex-col bg-[#05080f] text-[#f0f4fa]">
                <PublicNav />
                <main className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-md bg-[#080c16] border border-[#14b8a6]/30 rounded-2xl p-10 shadow-2xl text-center">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#14b8a6]/10 text-[#14b8a6]">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                        <p className="text-[rgba(240,244,250,0.6)] mb-8">
                            We've sent a verification link to <span className="text-white font-medium">{formData.email}</span>. Please verify your account to continue.
                        </p>
                        <Link href="/login" className="inline-block w-full rounded-lg bg-[#14b8a6] px-4 py-3 text-sm font-semibold text-[#05080f] transition hover:bg-[#0d9488]">
                            Return to Login
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#05080f] text-[#f0f4fa]">
            <PublicNav />

            <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md bg-[#080c16] border border-white/[0.06] rounded-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">

                    {/* Subtle glow effect */}
                    <div className="absolute top-[-20%] left-[-10%] w-[250px] h-[250px] bg-[#14b8a6]/10 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative text-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Create Partner Profile</h1>
                        <p className="text-[rgba(240,244,250,0.6)] text-sm">
                            If you already have a MyOrbisVoice account, enter your associated email and password to verify.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 relative">

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">First Name *</label>
                                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="John" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Last Name *</label>
                                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="Doe" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Gmail Address *</label>
                            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="yourname@gmail.com" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Password *</label>
                            <PasswordInput 
                                required 
                                name="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" 
                                placeholder="••••••••" 
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full rounded-lg bg-[#14b8a6] px-4 py-3.5 text-sm font-semibold text-[#05080f] transition hover:bg-[#0d9488] disabled:opacity-50"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                </div>
            </main>
        </div>
    );
}