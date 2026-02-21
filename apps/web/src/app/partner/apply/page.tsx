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
        phone: "",
        businessName: "",
        address: "",
        unit: "",
        city: "",
        state: "",
        zip: "",
        tinSsn: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Create FormData if we want to add file upload later, but for now it's JSON
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
                <div className="w-full max-w-2xl bg-[#080c16] border border-white/[0.06] rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">

                    {/* Subtle glow effect */}
                    <div className="absolute top-[-20%] left-[-10%] w-[250px] h-[250px] bg-[#14b8a6]/10 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative text-center mb-10">
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Partner Program</h1>
                        <p className="text-[rgba(240,244,250,0.6)]">
                            Join the MyOrbisVoice Partner Network and earn up to 30% lifetime commissions. Apply below to get started.
                            If you already have a MyOrbisVoice account, enter your associated email and password to verify.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 relative">

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">First Name *</label>
                                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="John" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Last Name *</label>
                                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="Doe" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Email Address *</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="john@company.com" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Password *</label>
                                <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="••••••••" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Cell / Phone *</label>
                                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="(555) 123-4567" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">TIN / SSN *</label>
                                <input required type="text" name="tinSsn" value={formData.tinSsn} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="XXX-XX-XXXX" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Business Name (Optional)</label>
                            <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="John Doe Consulting LLC" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Street Address *</label>
                                <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="123 Main St" />
                            </div>
                            <div className="col-span-1 space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Unit/Apt</label>
                                <input type="text" name="unit" value={formData.unit} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="Ste 200" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1 space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">City *</label>
                                <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="Austin" />
                            </div>
                            <div className="col-span-1 space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">State *</label>
                                <input required type="text" name="state" value={formData.state} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="TX" />
                            </div>
                            <div className="col-span-1 space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">Zip code *</label>
                                <input required type="text" name="zip" value={formData.zip} onChange={handleChange} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-[#14b8a6]" placeholder="78701" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/[0.06]">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(240,244,250,0.6)]">W-9 / 1099 Form Upload (Optional)</label>
                                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-white/[0.1] px-6 py-8 hover:border-[#14b8a6]/40 hover:bg-[#14b8a6]/5 transition cursor-pointer">
                                    <div className="text-center">
                                        <svg className="mx-auto h-8 w-8 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        <div className="mt-4 flex text-sm leading-6 text-gray-400 justify-center">
                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-[#14b8a6] hover:text-[#0d9488]">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs leading-5 text-gray-500">PDF, JPG up to 10MB (Coming soon)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-6 w-full rounded-lg bg-[#14b8a6] px-4 py-3.5 text-sm font-semibold text-[#05080f] transition hover:bg-[#0d9488] disabled:opacity-50"
                        >
                            {loading ? "Submitting Application..." : "Submit Partner Application"}
                        </button>
                    </form>

                </div>
            </main>
        </div>
    );
}
