'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useSubscription } from '@apollo/client'
import { ROOM_BY_CODE_QUERY, ROOM_UPDATED_SUBSCRIPTION } from '../../../lib/graphql/operations'

export default function RoomWaitingPage() {
  const params = useParams<{ code: string }>()
  const roomCode = (params?.code || '').toString().toUpperCase()

  const { data, loading, error, refetch } = useQuery(ROOM_BY_CODE_QUERY, {
    variables: { code: roomCode },
    skip: !roomCode,
    fetchPolicy: 'cache-and-network',
  })

  useSubscription(ROOM_UPDATED_SUBSCRIPTION, {
    variables: { roomCode },
    skip: !roomCode,
    onData: () => {
      refetch()
    },
  })

  const room = data?.roomByCode

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Room code</p>
            <h1 className="text-4xl font-semibold">{roomCode}</h1>
            <p className="mt-2 text-sm text-white/60">
              Share the code with your opponent. This screen updates as players join.
            </p>
          </div>
          <Link
            href={`/room/${roomCode}/game`}
            className="rounded-full bg-emerald-400/80 px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-950 transition hover:bg-emerald-300"
          >
            Go to game board
          </Link>
        </div>

        {loading && <p className="text-sm text-white/60">Loading room…</p>}
        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {error.message}
          </p>
        )}

        {room ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Owner</p>
              <p className="text-2xl font-semibold">{room.owner.username}</p>
              <p className="text-sm text-white/60">Status: {room.status}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Players</p>
              <div className="mt-4 space-y-3">
                {room.players.map((player: any) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3"
                  >
                    <div>
                      <p className="text-lg font-semibold">{player.username}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Rating {player.rating}
                      </p>
                    </div>
                    <span className="text-sm text-white/70">{player.status}</span>
                  </div>
                ))}
                {room.players.length === 0 && (
                  <p className="text-sm text-white/60">Waiting for players to join…</p>
                )}
              </div>
            </div>
          </>
        ) : (
          !loading && <p className="text-sm text-white/60">Room not found.</p>
        )}
      </div>
    </main>
  )
}

