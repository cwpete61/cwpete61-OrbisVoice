import './globals.css'

export const metadata = {
  title: 'OrbisVoice Phase Dashboard',
  description: 'Track the progress of OrbisVoice phases.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-base text-text-primary font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
