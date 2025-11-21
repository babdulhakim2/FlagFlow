import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlagFlow - AML Investigation System',
  description: 'Self-improving multi-agent financial crime detection',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}