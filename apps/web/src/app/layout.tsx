import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrbisVoice - AI Voice Agents for Your Business",
  description: "Create, configure, and embed real-time AI voice agents on your website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-void text-mist font-sans">
        {children}
      </body>
    </html>
  );
}
