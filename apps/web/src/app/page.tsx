import Link from "next/link";
import FAQItem from "./components/FAQItem";
import PublicNav from "./components/PublicNav";
import Footer from "./components/Footer";

// ─── data ──────────────────────────────────────────────────────────────────

const STATS = [
  { value: "28%", label: "faster call resolution" },
  { value: "3.4x", label: "agent utilisation lift" },
  { value: "12 days", label: "average go-live" },
  { value: "99.8%", label: "tool execution accuracy" },
];

const DELTAS = [
  {
    badge: "LIVE",
    title: "Intent Capture",
    desc: "Does your voice agent understand what the caller actually wants? We detect intent gaps, topic drift, and dead-end responses before they cost you a call.",
  },
  {
    badge: "REALTIME",
    title: "Tool Execution Gap",
    desc: "Why do callers hang up before booking? Identify friction in your voice-to-CRM funnel — from missed slots to failed payment authorisations.",
  },
  {
    badge: "AI",
    title: "Voice Quality Delta",
    desc: "Low-latency WebSocket streaming via Gemini. We monitor audio drop-offs, barge-in errors, and TTS artefacts in every session.",
  },
  {
    badge: "ANALYTICS",
    title: "Outcome Intelligence",
    desc: "Correlate conversation signals with real outcomes — bookings, payments, transfers — and close the loop on what's actually working.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create Your Agent",
    desc: "Enter your use case, prompt, and preferred voice. MyOrbisVoice auto-generates a baseline configuration from your business description.",
  },
  {
    num: "02",
    title: "Orchestration Engine Runs",
    desc: "Our engine wires Gemini Live, your tool stack (Calendar, CRM, Stripe, Twilio), and a policy layer — ready in under 5 minutes.",
  },
  {
    num: "03",
    title: "Deploy & Embed",
    desc: "Grab a single embed snippet or use the REST API. Your branded voice agent is live on your website, phone line, or app.",
  },
  {
    num: "04",
    title: "Monitor & Improve",
    desc: "Audit logs, per-call transcripts, tool execution records, and outcome analytics give you the full picture — and the levers to improve it.",
  },
];

const COMPARISON = [
  "Real-time Gemini voice streaming",
  "Tool calling (Calendar, CRM, Stripe, Twilio)",
  "Per-call audit logs & transcripts",
  "Intent gap detection",
  "One-click embed snippet",
  "Outcome analytics dashboard",
  "Multi-tenant isolation",
  "Bring your own API keys",
];

const TESTIMONIALS = [
  {
    quote:
      "We had no idea our call agent was dropping 40% of intents. OrbisVoice showed us exactly where callers were hitting dead ends. Fixed in a week.",
    name: "Marcus Rivera",
    role: "Owner, Rivera Plumbing",
    result: "+47% bookings",
  },
  {
    quote:
      "The Stripe and Calendar integrations alone paid for themselves in a month. Patients book, pay, and get confirmations — all in one call.",
    name: "Dr Sarah Chen",
    role: "Practice Manager, Bright Smile Dental",
    result: "$312K recovered",
  },
  {
    quote:
      "We manage 6 locations. MyOrbisVoice's audit logs let us see which agents need tuning before they lose calls. It's like X-ray vision for voice ops.",
    name: "Jake Thompson",
    role: "Marketing Director, Thompson HVAC Group",
    result: "6 locations live",
  },
];

const FAQS = [
  {
    q: "What is an AI voice agent?",
    a: "An AI voice agent is a real-time, conversational AI that handles phone or web calls on your behalf — understanding natural speech, executing tasks (booking, payments, lookups), and responding in a natural voice powered by Google Gemini.",
  },
  {
    q: "How is MyOrbisVoice different from basic IVR or chatbots?",
    a: "MyOrbisVoice uses Google Gemini's live audio API for true real-time speech understanding — not keyword matching or pre-recorded trees. Agents can handle open-ended questions, perform multi-step tool calls, and hand off to humans when needed.",
  },
  {
    q: "How long does it take to deploy?",
    a: "Most agents are production-ready in under 12 days. The initial setup — voice configuration, tool wiring, and embed snippet — takes under 5 minutes. Integration testing, prompt tuning, and QA account for the rest.",
  },
  {
    q: "Do I need to give you access to my Google or CRM account?",
    a: "No. You bring your own API keys. MyOrbisVoice never stores credentials — keys are encrypted at rest in your tenant's vault and passed only at execution time.",
  },
  {
    q: "What tools can voice agents call?",
    a: "Out of the box: Google Calendar, Gmail, Stripe, and Twilio. You can extend via the REST API to connect any CRM, EHR, POS, or internal system with a webhook or JSON endpoint.",
  },
  {
    q: "Is there audit logging for compliance?",
    a: "Yes. Every tool call, tool result, and transcript segment is logged per-session in tamper-evident audit records. Exports are available in JSON or CSV for SOC 2 and HIPAA workflows.",
  },
];

// ─── page ──────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-[#05080f] text-[#f0f4fa]">

      {/* ── Nav ── */}
      <PublicNav />

      <main>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden pb-24 pt-20">
          {/* ambient glows */}
          <div className="hero-glow h-[500px] w-[500px] bg-[#14b8a6]/20 left-[-10%] top-[-15%]" style={{position:"absolute"}} />
          <div className="hero-glow h-[400px] w-[400px] bg-[#f97316]/10 right-[-8%] top-[10%]" style={{position:"absolute"}} />

          <div className="ov-container relative text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-[#14b8a6]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
              Real-time AI voice agents powered by Google Gemini
            </div>

            <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.1] tracking-tight text-[#f0f4fa] md:text-6xl">
              Why are your best leads{" "}
              <span className="text-[#14b8a6] italic">silent</span>{" "}
              after the first call?
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-[rgba(240,244,250,0.6)]">
              OrbisVoice builds AI voice agents that listen, execute tools, and close intent — so no call, booking, or payment escapes.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup" className="btn-primary px-8 py-3 text-base">
                Deploy Your Agent Free
              </Link>
              <Link href="#how-it-works" className="btn-secondary px-8 py-3 text-base">
                See How It Works
              </Link>
            </div>

            <p className="mt-3 text-xs text-[rgba(240,244,250,0.35)]">No credit card required · Live in under 5 minutes</p>

            {/* stat row */}
            <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.value} className="stat-badge text-center">
                  <div className="text-2xl font-bold text-[#14b8a6]">{s.value}</div>
                  <div className="mt-1 text-xs text-[rgba(240,244,250,0.5)]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Four Deltas ── */}
        <section id="features" className="ov-container py-20">
          <div className="mb-12 text-center">
            <p className="label mb-3">Voice Intelligence</p>
            <h2 className="text-3xl font-bold text-[#f0f4fa] md:text-4xl">
              The Four Voice Agent Deltas
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[rgba(240,244,250,0.55)]">
              We analyse every voice session through four critical lenses to find exactly where you're losing calls and revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {DELTAS.map((d) => (
              <div key={d.title} className="ov-card relative overflow-hidden p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="label">{d.badge}</div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-[#f0f4fa]">{d.title}</h3>
                <p className="text-sm leading-relaxed text-[rgba(240,244,250,0.55)]">{d.desc}</p>
                <div className="mt-6 h-px bg-white/[0.05]" />
                <div className="mt-4 flex items-center gap-2 text-xs text-[#14b8a6]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6]" />
                  Monitored per session
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="border-t border-white/[0.05] bg-[#080c16] py-20">
          <div className="ov-container">
            <div className="mb-12 text-center">
              <p className="label mb-3">Process</p>
              <h2 className="text-3xl font-bold text-[#f0f4fa] md:text-4xl">How It Works</h2>
              <p className="mx-auto mt-4 max-w-lg text-[rgba(240,244,250,0.55)]">
                From sign-up to a production voice agent in under 5 minutes.
              </p>
            </div>

            <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <div key={step.num} className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="step-num">{step.num}</div>
                    <div className="h-px flex-1 bg-white/[0.07]" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-[#f0f4fa]">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[rgba(240,244,250,0.5)]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Comparison Table ── */}
        <section className="ov-container py-20">
          <div className="mb-10 text-center">
            <p className="label mb-3">Why MyOrbisVoice?</p>
            <h2 className="text-3xl font-bold text-[#f0f4fa] md:text-4xl">
              We go deeper than any basic IVR or chatbot.
            </h2>
          </div>

          <div className="ov-card overflow-hidden">
            <div className="grid grid-cols-3 border-b border-white/[0.07] bg-[#0a1020] px-6 py-4 text-xs font-semibold uppercase tracking-widest">
              <div className="col-span-1 text-[rgba(240,244,250,0.4)]">Feature</div>
              <div className="text-center text-[#14b8a6]">MyOrbisVoice</div>
              <div className="text-center text-[rgba(240,244,250,0.3)]">Basic Tools</div>
            </div>
            {COMPARISON.map((feature, i) => (
              <div
                key={feature}
                className={`grid grid-cols-3 items-center border-b border-white/[0.05] px-6 py-4 text-sm ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}
              >
                <div className="text-[rgba(240,244,250,0.75)]">{feature}</div>
                <div className="text-center text-[#14b8a6]">✓</div>
                <div className="text-center text-[rgba(240,244,250,0.25)]">✗</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="border-t border-white/[0.05] bg-[#080c16] py-20">
          <div className="ov-container">
            <div className="mb-12 text-center">
              <p className="label mb-3">Social Proof</p>
              <h2 className="text-3xl font-bold text-[#f0f4fa] md:text-4xl">Trusted by teams that run on calls</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="ov-card flex flex-col justify-between p-6">
                  <p className="text-sm leading-relaxed text-[rgba(240,244,250,0.7)]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <div>
                      <div className="text-sm font-semibold text-[#f0f4fa]">{t.name}</div>
                      <div className="text-xs text-[rgba(240,244,250,0.4)]">{t.role}</div>
                    </div>
                    <div className="rounded-md bg-[#14b8a6]/10 px-3 py-1 text-xs font-bold text-[#14b8a6]">
                      {t.result}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="ov-container py-20">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.5fr]">
            <div>
              <p className="label mb-4">FAQ</p>
              <h2 className="text-3xl font-bold text-[#f0f4fa]">Frequently Asked Questions</h2>
              <p className="mt-4 text-sm text-[rgba(240,244,250,0.5)]">
                Everything you need to know about MyOrbisVoice's AI voice agent platform.
              </p>
              <div className="mt-8">
                <Link href="/signup" className="btn-primary">
                  Deploy Your Agent Free
                </Link>
              </div>
            </div>
            <div>
              {FAQS.map((faq) => (
                <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="border-t border-white/[0.05] bg-[#080c16] py-24">
          <div className="ov-container text-center">
            <p className="label mb-4">Free Agent Analysis</p>
            <h2 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight text-[#f0f4fa] md:text-5xl">
              Stop losing customers you<br />
              <span className="text-[#14b8a6] italic">can&rsquo;t hear.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[rgba(240,244,250,0.55)]">
              Deploy your first AI voice agent and discover exactly where calls are dropping — and how much revenue it's costing you.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/signup" className="btn-primary px-10 py-3.5 text-base">
                Deploy Your Agent Free
              </Link>
              <Link href="#how-it-works" className="btn-secondary px-10 py-3.5 text-base">
                Schedule a Walkthrough
              </Link>
            </div>
            <p className="mt-4 text-xs text-[rgba(240,244,250,0.3)]">No credit card required · Results in under 5 minutes</p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
