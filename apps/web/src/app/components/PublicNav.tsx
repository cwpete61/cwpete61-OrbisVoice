import Link from "next/link";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partner/apply", label: "Partner Program" },
  { href: "/blog", label: "Blog" },
];

export default function PublicNav() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#05080f]/90 backdrop-blur-sm">
        <div className="ov-container flex items-center justify-between py-[20px]">
          <Link href="/" className="flex items-center gap-2 py-[10px]">
            <div className="h-8 w-8 rounded-lg bg-[#14b8a6]" />
            <span className="text-[1.05rem] font-bold tracking-tight text-[#f0f4fa]">MyOrbisVoice</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-[rgba(240,244,250,0.65)] md:flex">
            {LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-[#f0f4fa] transition">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm text-[rgba(240,244,250,0.65)] hover:text-[#f0f4fa] transition md:block">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </header>
      <div aria-hidden className="h-[50px]" />
    </>
  );
}
