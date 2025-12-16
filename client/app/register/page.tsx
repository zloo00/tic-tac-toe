'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client'
import { REGISTER_MUTATION } from '../../lib/graphql/operations'
import { useAuthStore } from '../../store'

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [formState, setFormState] = useState({ email: '', username: '', password: '' })
  const [error, setError] = useState<string | null>(null)

  const [registerMutation, { loading }] = useMutation(REGISTER_MUTATION)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      const { data } = await registerMutation({
        variables: { input: formState },
      })

      if (data?.register) {
        setAuth({
          user: data.register.user,
          token: data.register.token,
        })
        router.push('/lobby')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to register')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
          Join the lobby
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Create your player profile
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Already have an account?{' '}
          <Link className="text-emerald-300 underline" href="/login">
            Login
          </Link>
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-white/80" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formState.email}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-400/60"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-white/80" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formState.username}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-400/60"
              placeholder="PlayerOne"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-white/80" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formState.password}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-emerald-400/60"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-emerald-400/80 px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.25em] text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
      </div>
    </main>
  )
}

