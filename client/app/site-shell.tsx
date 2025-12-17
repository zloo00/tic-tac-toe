'use client'

import type { ReactNode } from 'react'
import AppHeader from '../components/AppHeader'

interface Props {
  children: ReactNode
}

export default function SiteShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      {children}
    </div>
  )
}

