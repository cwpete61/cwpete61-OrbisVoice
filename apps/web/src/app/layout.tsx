import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MyOrbisVoice - AI Voice Agents for Your Business",
  description: "Create, configure, and embed real-time AI voice agents on your website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-base text-text-primary font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
