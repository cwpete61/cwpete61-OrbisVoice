"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicNav from "../../components/PublicNav";

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/public-apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Something went wrong creating application.");
            }

            // If success, user token is returned
            if (data.data?.token) {
                localStorage.setItem("token", data.data.token);
            }

            router.push("/affiliates?welcome=true");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Email Address *</label>
                            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="john@company.com" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Password *</label>
                            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="••••••••" />
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
