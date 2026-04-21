'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        return
      }

      // Redirect based on role
      const role = data.user.role
      if (role === 'COACH') {
        router.push('/admin/coach')
      } else {
        router.push('/admin')
      }
    } catch {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5"
      style={{ background: '#0A1628' }}>
      <div className="w-full max-w-sm space-y-8">

        {/* Logo / brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2"
            style={{ background: '#CCFF00' }}>
            <span style={{ fontSize: '2rem' }}>🥷</span>
          </div>
          <h1 className="font-display font-semibold text-white" style={{ fontSize: '1.75rem' }}>
            Staff login
          </h1>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Ninja Academy · Bangkok
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.40)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@ninja.academy"
              required
              autoComplete="email"
              className="input-dark"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.40)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="input-dark"
            />
          </div>

          {error && (
            <p className="text-sm font-bold text-center" style={{ color: '#F87171' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-ninja w-full font-display"
            style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.20)' }}>
          Parents — use the portal link sent to you
        </p>
      </div>
    </div>
  )
}
