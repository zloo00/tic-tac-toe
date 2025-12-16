'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useSubscription } from '@apollo/client'
import { LOBBY_ROOMS_QUERY, ROOM_UPDATED_SUBSCRIPTION } from '../../lib/graphql/operations'

export default function LobbyPage() {
  const [focusedRoomCode, setFocusedRoomCode] = useState<string | null>(null)

  const { data, loading, error, refetch } = useQuery(LOBBY_ROOMS_QUERY, {
    fetchPolicy: 'cache-and-network',
  })

  useSubscription(ROOM_UPDATED_SUBSCRIPTION, {
    variables: { roomCode: focusedRoomCode ?? '' },
    skip: !focusedRoomCode,
    onData: () => {
      refetch()
    },
  })

  const rooms = data?.lobbyRooms ?? []

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Lobby</p>
            <h1 className="mt-2 text-4xl font-semibold">Active Rooms</h1>
            <p className="mt-2 text-white/60">
              Watch rooms in realtime. Focus a room to subscribe to instant updates.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:border-white/60"
          >
            Leaderboard →
          </Link>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          {loading && <p className="text-sm text-white/60">Loading rooms…</p>}
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error.message}
            </p>
          )}

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {rooms.map((room: any) => {
              const isFocused = focusedRoomCode === room.code
              return (
                <div
                  key={room.id}
                  className={`rounded-2xl border px-6 py-5 transition ${
                    isFocused
                      ? 'border-emerald-300 bg-emerald-300/5'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/60">Code</p>
                      <p className="text-2xl font-semibold">{room.code}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
                      {room.status}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-white/70">
                    Owner: <span className="font-semibold text-white">{room.owner.username}</span>
                  </p>
                  <p className="text-sm text-white/70">
                    Players:{' '}
                    {room.players.map((player: any) => player.username).join(' vs ') || '—'}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:border-white/60"
                      onClick={() =>
                        setFocusedRoomCode((prev) => (prev === room.code ? null : room.code))
                      }
                    >
                      {isFocused ? 'Unsubscribe' : 'Watch realtime'}
                    </button>
                    <Link
                      className="rounded-full bg-emerald-400/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-950 transition hover:bg-emerald-300"
                      href={`/room/${room.code}`}
                    >
                      View room
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {!loading && rooms.length === 0 && (
            <p className="text-center text-sm text-white/60">No rooms yet. Create one from the API.</p>
          )}
        </div>
      </div>
    </main>
  )
}

