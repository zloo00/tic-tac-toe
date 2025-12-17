'use client'

import Link from 'next/link'
import { useAuthStore, useGameStore, useUIStore } from '../store'

export default function Home() {
  const token = useAuthStore((state) => state.token)
  const { board, status } = useGameStore((state) => ({
    board: state.board,
    status: state.status,
  }))
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
          Tic-Tac-Toe Online
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">
          Realtime battles, rankings, and chat — all in one lobby
        </h1>
        <p className="mt-6 text-base text-white/70">
          GraphQL API, Apollo Client, Zustand stores, and TailwindCSS are wired up. Start
          building auth, lobby, game, and leaderboard flows with realtime updates.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
          <div className="rounded-lg border border-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
              Auth token
            </p>
            <p className="mt-1 font-mono text-white">
              {token ? `${token.slice(0, 8)}…` : 'Not set'}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
              Game status
            </p>
            <p className="mt-1 font-semibold text-white">{status}</p>
          </div>
          <div className="rounded-lg border border-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
              Sidebar
            </p>
            <button
              onClick={toggleSidebar}
              className="mt-2 rounded-full bg-emerald-400/10 px-4 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
            >
              {sidebarOpen ? 'Hide panel' : 'Show panel'}
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-3 font-mono text-lg text-white/80">
          {board.map((cell, index) => (
            <div
              key={index}
              className="flex aspect-square items-center justify-center rounded-lg border border-white/15 bg-white/5"
            >
              {cell || '-'}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm">
          <Link
            href="/login"
            className="rounded-full bg-white/10 px-6 py-2 font-semibold text-white transition hover:bg-white/20"
          >
            Sign in
          </Link>
          <Link
            href="/lobby"
            className="rounded-full border border-white/30 px-6 py-2 font-semibold text-white transition hover:border-white/60"
          >
            View lobby
          </Link>
        </div>
      </div>
    </main>
  )
}
