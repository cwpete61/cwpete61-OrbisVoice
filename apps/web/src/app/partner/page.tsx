import Link from "next/link";
import PublicNav from "../components/PublicNav";

async function getCommissionRate() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/program-details`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        if (res.ok) {
            const json = await res.json();
            return json.data.commissionRate || 30;
        }
    } catch (err) {
        console.error("Failed to fetch commission rate:", err);
    }
    return 30; // Fallback
}

export default async function PartnerLandingPage() {
    const commissionRate = await getCommissionRate();

    return (
        <div className="flex min-h-screen flex-col bg-[#05080f] text-[#f0f4fa] overflow-x-hidden">
            <PublicNav />

            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center z-10">
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#14b8a6]/10 rounded-full blur-[120px] pointer-events-none" />

                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Partner With <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14b8a6] to-[#0ea5e9]">OrbisVoice</span>
                </h1>

                <p className="max-w-2xl text-lg md:text-xl text-[rgba(240,244,250,0.7)] mb-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150">
                    Join our exclusive network of affiliates and agencies. Earn an industry-leading <strong className="text-white">{commissionRate}% lifetime commission</strong> on every customer you refer to the platform.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                    <Link
                        href="/partner/apply"
                        className="rounded-full bg-[#14b8a6] px-8 py-4 text-sm font-bold text-[#05080f] transition hover:bg-[#0d9488] hover:scale-105 shadow-[0_0_30px_rgba(20,184,166,0.3)] ring-1 ring-[#14b8a6]/50"
                    >
                        Apply Now
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-full bg-white/[0.05] px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.1] border border-white/[0.1]"
                    >
                        Sign In to Partner Dashboard
                    </Link>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="bg-[#080c16] border border-white/[0.06] rounded-2xl p-8 hover:border-[#14b8a6]/30 transition-colors group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6]/0 via-[#14b8a6]/0 to-[#14b8a6]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="h-12 w-12 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center text-[#14b8a6] mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{commissionRate}% Lifetime Revenue</h3>
                        <p className="text-[rgba(240,244,250,0.6)] leading-relaxed">
                            You bring the client, we deliver the voice agents. Enjoy a recurring {commissionRate}% cut of their subscription fee for as long as they remain a customer. No limits, no caps.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-[#080c16] border border-white/[0.06] rounded-2xl p-8 hover:border-[#3b82f6]/30 transition-colors group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/0 via-[#3b82f6]/0 to-[#3b82f6]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="h-12 w-12 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Real-Time Analytics</h3>
                        <p className="text-[rgba(240,244,250,0.6)] leading-relaxed">
                            Track your clicks, conversions, and pending payouts through a dedicated, state-of-the-art backend dashboard designed specifically for our affiliates.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-[#080c16] border border-white/[0.06] rounded-2xl p-8 hover:border-[#f59e0b]/30 transition-colors group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#f59e0b]/0 via-[#f59e0b]/0 to-[#f59e0b]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="h-12 w-12 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b] mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Automated Payouts</h3>
                        <p className="text-[rgba(240,244,250,0.6)] leading-relaxed">
                            We&apos;ve partnered with Stripe Connect to automate the flow of your commissions directly to your bank account every month. Say goodbye to manual invoicing.
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="relative z-10 w-full bg-[#080c16] border-t border-b border-white/[0.06] py-24">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-16">How It Works</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-[24px] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-[#14b8a6]/0 via-[#14b8a6]/20 to-[#14b8a6]/0" />

                        <div className="relative group">
                            <div className="mx-auto h-12 w-12 rounded-full bg-[#05080f] border-2 border-[#14b8a6] flex items-center justify-center text-[#14b8a6] font-bold text-lg mb-6 z-10 relative shadow-[0_0_15px_rgba(20,184,166,0.3)]">1</div>
                            <h4 className="text-xl font-semibold text-white mb-3">Apply Quickly</h4>
                            <p className="text-sm text-[rgba(240,244,250,0.6)]">Fill out our rapid onboarding form using just your name and email to instantly generate your unique referral link.</p>
                        </div>
                        <div className="relative group">
                            <div className="mx-auto h-12 w-12 rounded-full bg-[#05080f] border-2 border-[#14b8a6] flex items-center justify-center text-[#14b8a6] font-bold text-lg mb-6 z-10 relative">2</div>
                            <h4 className="text-xl font-semibold text-white mb-3">Complete Profile</h4>
                            <p className="text-sm text-[rgba(240,244,250,0.6)]">Log into your new dashboard to fill in your secure payout info (Stripe Connect) and upload your tax documentation.</p>
                        </div>
                        <div className="relative group">
                            <div className="mx-auto h-12 w-12 rounded-full bg-[#05080f] border-2 border-[#14b8a6] flex items-center justify-center text-[#14b8a6] font-bold text-lg mb-6 z-10 relative shadow-[0_0_15px_rgba(20,184,166,0.3)]">3</div>
                            <h4 className="text-xl font-semibold text-white mb-3">Earn Commissions</h4>
                            <p className="text-sm text-[rgba(240,244,250,0.6)]">Start distributing your link. As soon as a referred user transitions into a paid tier, your {commissionRate}% cut locks in automatically.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="relative z-10 py-32 text-center px-6">
                <h2 className="text-4xl font-bold text-white mb-8">Ready to start earning?</h2>
                <Link
                    href="/partner/apply"
                    className="inline-block rounded-full bg-white text-[#05080f] px-10 py-4 text-sm font-bold transition hover:bg-gray-200"
                >
                    Create Your Partner Account
                </Link>
            </section>

        </div>
    );
}
