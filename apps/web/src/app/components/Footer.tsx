import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#05080f] pt-[50px]">
      <div className="ov-container py-[50px]">
        <div className="grid gap-[50px] md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3 py-[10px]">
              <div className="h-8 w-8 rounded-lg bg-[#14b8a6]" />
              <span className="text-lg font-bold tracking-tight text-[#f0f4fa]">MyOrbisVoice</span>
            </div>
            <p className="text-sm text-[rgba(240,244,250,0.55)]">
              AI voice agents that listen, execute tools, and close intent for local businesses.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#f0f4fa]">Legal</h3>
            <ul className="space-y-3 text-sm text-[rgba(240,244,250,0.55)]">
              <li>
                <Link href="/privacy" className="hover:text-[#14b8a6] transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#14b8a6] transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-[#14b8a6] transition">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="hover:text-[#14b8a6] transition">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#f0f4fa]">Resources</h3>
            <ul className="space-y-3 text-sm text-[rgba(240,244,250,0.55)]">
              <li>
                <Link href="/blog" className="hover:text-[#14b8a6] transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-[#14b8a6] transition">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="hover:text-[#14b8a6] transition">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-[#14b8a6] transition">
                  Support Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-[#f0f4fa]">Contact</h3>
            <ul className="space-y-3 text-sm text-[rgba(240,244,250,0.55)]">
              <li>
                <a href="mailto:hello@myorbisvoice.com" className="hover:text-[#14b8a6] transition">
                  hello@myorbisvoice.com
                </a>
              </li>
              <li>
                <a href="tel:+1-555-ORBIS-AI" className="hover:text-[#14b8a6] transition">
                  +1 (555) ORBIS-AI
                </a>
              </li>
              <li className="text-xs color-[rgba(240,244,250,0.45)]">
                123 Voice Street<br />
                San Francisco, CA 94105<br />
                United States
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-[50px] border-t border-white/[0.06]" />

        {/* Bottom */}
        <div className="mt-[50px] flex flex-col items-center justify-between gap-4 md:flex-row text-xs text-[rgba(240,244,250,0.35)]">
          <p>&copy; 2026 MyOrbisVoice, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#14b8a6] transition">
              Twitter
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#14b8a6] transition">
              LinkedIn
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#14b8a6] transition">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
