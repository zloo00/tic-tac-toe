'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '../store'

const links = [
  { href: '/', label: 'Home' },
  { href: '/lobby', label: 'Lobby' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export default function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-white">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-300">
          TIC-TAC-TOE
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/70">
          {links.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition hover:text-white ${active ? 'text-white font-semibold' : ''}`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {user ? (
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/30 text-lg font-semibold uppercase">
              {user.username.slice(0, 1)}
            </div>
            <div className="text-left text-sm leading-tight">
              <p className="font-semibold text-white">{user.username}</p>
              <p className="text-xs text-white/60">{user.rating} ELO</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:border-white/50"
            >
              Выйти
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:border-white/60"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
