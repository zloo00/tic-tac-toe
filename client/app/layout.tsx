import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import SiteShell from './site-shell'

export const metadata: Metadata = {
  title: 'Tic-Tac-Toe Online',
  description: 'Play Tic-Tac-Toe online with friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  )
}
