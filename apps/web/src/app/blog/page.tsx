import Link from "next/link";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";

const ARTICLES = [
  {
    slug: "voice-agents-local-business",
    title: "How Voice Agents Transform Local Businesses",
    excerpt: "Discover how AI voice agents are helping plumbers, dentists, and HVAC companies close more calls and recover lost revenue.",
    date: "Feb 10, 2026",
    readTime: "5 min read",
    color: "#14b8a6",
  },
  {
    slug: "gemini-live-voice-api",
    title: "Real-Time Voice AI: Inside Google Gemini Live",
    excerpt: "Explore how the Gemini Live API enables true conversational AI by streaming audio without the latency of traditional systems.",
    date: "Feb 5, 2026",
    readTime: "7 min read",
    color: "#f97316",
  },
  {
    slug: "intent-gaps-call-center",
    title: "The Intent Gap: Why Callers Hang Up (And How to Fix It)",
    excerpt: "Learn how MyOrbisVoice detects intent gaps in real time and helps teams improve their voice agent performance before it costs you a booking.",
    date: "Jan 28, 2026",
    readTime: "6 min read",
    color: "#a78bfa",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#05080f] text-[#f0f4fa]">
      <PublicNav />
      <div className="ov-container py-16">
        <div className="mb-12 max-w-3xl">
          <p className="pill">Blog</p>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
            Insights on voice AI and local business automation
          </h1>
          <p className="mt-4 text-base text-[rgba(240,244,250,0.6)]">
            Deep dives into voice agents, intent detection, call analytics, and deployment strategies for modern sales and support teams.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group flex flex-col rounded-2xl border border-white/[0.07] bg-[#0c111d] overflow-hidden hover:border-white/[0.12] transition"
            >
              {/* Hero placeholder */}
              <div
                className="h-48 w-full transition group-hover:opacity-75"
                style={{ background: `linear-gradient(135deg, ${article.color}/30, ${article.color}/10)` }}
              >
                <div className="flex h-full items-center justify-center">
                  <svg width="80" height="80" fill="none" stroke={article.color} strokeWidth="1" opacity="0.5" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5-6 6-4-4" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: article.color }}>
                    {article.readTime}
                  </span>
                  <span className="text-xs text-[rgba(240,244,250,0.35)]">·</span>
                  <span className="text-xs text-[rgba(240,244,250,0.35)]">{article.date}</span>
                </div>
                <h2 className="mb-2 text-xl font-bold text-[#f0f4fa] group-hover:text-[#14b8a6] transition">
                  {article.title}
                </h2>
                <p className="flex-1 text-sm text-[rgba(240,244,250,0.55)]">
                  {article.excerpt}
                </p>
                <div className="mt-4 flex items-center text-sm font-semibold transition" style={{ color: article.color }}>
                  Read article
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2 group-hover:translate-x-1 transition" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-white/[0.07] bg-[#0c111d] p-8 text-center">
          <h2 className="text-xl font-semibold">More articles coming soon</h2>
          <p className="mt-2 text-sm text-[rgba(240,244,250,0.55)]">
            Subscribe to our newsletter to get the latest updates on voice AI and automation strategies.
          </p>
          <button className="btn-primary mt-6">Subscribe</button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
