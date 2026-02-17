import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orbit-blue via-void to-slate">
      {/* Navigation */}
      <nav className="border-b border-slate px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-signal-cyan">OrbisVoice</div>
          <div className="space-x-6">
            <Link href="#features" className="hover:text-signal-cyan transition">Features</Link>
            <Link href="#pricing" className="hover:text-signal-cyan transition">Pricing</Link>
            <Link href="/login" className="bg-signal-cyan text-orbit-blue px-4 py-2 rounded hover:bg-aurora-green transition">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-4 text-mist">
          Real-Time AI Voice Agents
        </h1>
        <p className="text-xl text-slate mb-8">
          Create and embed natural voice conversations powered by Google Gemini
        </p>
        <Link
          href="/signup"
          className="bg-signal-cyan text-orbit-blue px-8 py-3 rounded text-lg font-semibold hover:bg-aurora-green transition"
        >
          Get Started Free
        </Link>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold mb-12 text-center text-mist">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Voice Creation", desc: "Build agents with custom prompts and voice selection" },
            { title: "Real-Time Streaming", desc: "Low-latency audio streaming via WebSocket" },
            { title: "Tool Calling", desc: "Agents can invoke external APIs and tools" },
          ].map((feat) => (
            <div key={feat.title} className="bg-slate/30 border border-slate p-6 rounded">
              <h3 className="text-xl font-semibold text-signal-cyan mb-2">{feat.title}</h3>
              <p className="text-mist">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-orbit-blue border-t border-slate py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4 text-mist">Ready to deploy AI voice?</h2>
          <Link
            href="/signup"
            className="bg-plasma-orange text-white px-8 py-3 rounded text-lg font-semibold hover:bg-aurora-green transition"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
