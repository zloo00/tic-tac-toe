import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

