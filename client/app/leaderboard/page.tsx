'use client'

import { useQuery } from '@apollo/client'
import { LEADERBOARD_QUERY } from '../../lib/graphql/operations'

export default function LeaderboardPage() {
  const { data, loading, error } = useQuery(LEADERBOARD_QUERY, {
    variables: { limit: 20 },
    fetchPolicy: 'cache-and-network',
  })

  const entries = data?.leaderboard ?? []

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Leaderboard</p>
        <h1 className="mt-2 text-4xl font-semibold">Top Players</h1>
        <p className="mt-2 text-white/60">
          Live ELO-style ratings update whenever games finish. Track your climb!
        </p>

        {loading && <p className="mt-6 text-sm text-white/60">Loading leaderboard…</p>}
        {error && (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {error.message}
          </p>
        )}

        <div className="mt-8 space-y-4">
          {entries.map((entry: any) => (
            <div
              key={entry.user.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-emerald-300">#{entry.rank}</div>
                <div>
                  <p className="text-xl font-semibold">{entry.user.username}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Games {entry.gamesPlayed} · Win rate {(entry.winRate * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="text-2xl font-semibold">{entry.rating}</div>
            </div>
          ))}
        </div>

        {!loading && entries.length === 0 && (
          <p className="mt-6 text-center text-sm text-white/60">
            No leaderboard data yet. Play some games!
          </p>
        )}
      </div>
    </main>
  )
}

