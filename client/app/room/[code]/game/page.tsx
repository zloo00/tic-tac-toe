'use client'

import { useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useSubscription } from '@apollo/client'
import {
  GAME_BY_ROOM_QUERY,
  GAME_UPDATED_SUBSCRIPTION,
  MAKE_MOVE_MUTATION,
} from '../../../../lib/graphql/operations'
import { useGameStore } from '../../../../store'

export default function GameBoardPage() {
  const params = useParams<{ code: string }>()
  const roomCode = (params?.code || '').toString().toUpperCase()

  const setBoard = useGameStore((state) => state.setBoard)
  const setMeta = useGameStore((state) => state.setMeta)
  const board = useGameStore((state) => state.board)

  const { data, loading, error, refetch } = useQuery(GAME_BY_ROOM_QUERY, {
    variables: { roomCode },
    skip: !roomCode,
    fetchPolicy: 'cache-and-network',
  })

  useEffect(() => {
    if (data?.gameByRoom) {
      const game = data.gameByRoom
      setBoard([...game.board])
      setMeta({
        roomCode,
        turnUserId: game.turn?.id ?? null,
        winnerUserId: game.winner?.id ?? null,
        status: game.status,
      })
    }
  }, [data, roomCode, setBoard, setMeta])

  useSubscription(GAME_UPDATED_SUBSCRIPTION, {
    variables: { roomCode },
    skip: !roomCode,
    onData: ({ data: subscriptionData }) => {
      const game = subscriptionData.data?.gameUpdated
      if (game) {
        setBoard([...game.board])
        setMeta({
          roomCode,
          turnUserId: game.turn?.id ?? null,
          winnerUserId: game.winner?.id ?? null,
          status: game.status,
        })
      }
      refetch()
    },
  })

  const [makeMoveMutation, { loading: moveLoading }] = useMutation(MAKE_MOVE_MUTATION)

  const handleCellClick = async (index: number) => {
    if (!roomCode) {
      return
    }

    try {
      await makeMoveMutation({
        variables: {
          input: {
            roomCode,
            cellIndex: index,
          },
        },
      })
    } catch {
      // ignore error for now; UI can show toast later
    }
  }

  const players = useMemo(() => data?.gameByRoom?.players ?? [], [data])
  const winner = data?.gameByRoom?.winner
  const turn = data?.gameByRoom?.turn
  const status = data?.gameByRoom?.status ?? 'RUNNING'

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row">
        <section className="flex-1 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Room</p>
              <h1 className="text-3xl font-semibold">{roomCode}</h1>
            </div>
            <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              {status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-3xl text-white">
            {board.map((cell, index) => (
              <button
                key={index}
                className="aspect-square rounded-xl border border-white/15 bg-white/5 text-4xl font-bold transition hover:border-white/40"
                onClick={() => handleCellClick(index)}
                disabled={Boolean(cell) || moveLoading}
              >
                {cell || ''}
              </button>
            ))}
          </div>

          {loading && <p className="text-sm text-white/60">Loading game…</p>}
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error.message}
            </p>
          )}
        </section>

        <aside className="w-full space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur lg:w-96">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Players</p>
            <div className="mt-4 space-y-3">
              {players.map((player: any) => (
                <div
                  key={player.user.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3"
                >
                  <div>
                    <p className="text-lg font-semibold">{player.user.username}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      Symbol {player.symbol}
                    </p>
                  </div>
                  <span className="text-sm text-white/70">{player.user.rating} ELO</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            <p>
              <span className="font-semibold text-white">Turn:</span>{' '}
              {turn ? turn.username : '—'}
            </p>
            <p>
              <span className="font-semibold text-white">Winner:</span>{' '}
              {winner ? winner.username : status === 'FINISHED' ? 'Draw' : '—'}
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}

