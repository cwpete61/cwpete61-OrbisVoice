"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partner", label: "Partner Program" },
  { href: "/blog", label: "Blog" },
];

export default function PublicNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/[0.06] bg-[#05080f]/90 backdrop-blur-md">
        <div className="ov-container flex items-center justify-between py-4 md:py-5">
          {/* Logo */}
          <Link href="/" className="z-[110] flex items-center gap-2 py-2">
            <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-[#14b8a6] shadow-[0_0_15px_rgba(20,184,166,0.4)]" />
            <span className="text-lg md:text-[1.05rem] font-bold tracking-tight text-[#f0f4fa]">MyOrbisVoice</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-[rgba(240,244,250,0.6)] md:flex">
            {LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-[#f0f4fa] transition-colors duration-200">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden text-sm font-medium text-[rgba(240,244,250,0.6)] hover:text-[#f0f4fa] transition-colors duration-200 md:block">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-sm px-5 py-2.5">Get Started</Link>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-[110] flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#f0f4fa] md:hidden"
              aria-label="Toggle Menu"
            >
              {isOpen ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        <div 
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05080f] transition-all duration-300 md:hidden ${
            isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
          }`}
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#14b8a6] opacity-10 blur-[100px] pointer-events-none" />
          
          <nav className="relative z-10 flex flex-col items-center gap-10 text-center">
            {LINKS.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className="text-3xl font-bold tracking-tighter text-[#f0f4fa] active:text-[#14b8a6] transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="h-px w-16 bg-white/[0.1]" />
            <Link 
              href="/login" 
              className="text-xl font-semibold text-[rgba(240,244,250,0.6)] active:text-[#f0f4fa]"
            >
              Sign In
            </Link>
          </nav>
        </div>

      </header>
      <div aria-hidden className="h-[72px] md:h-[80px]" />
    </>
  );
}

