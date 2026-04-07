'use client'

import { useState } from 'react'

interface Props {
  onSuccess: () => void
}

export default function AdminLogin({ onSuccess }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      onSuccess()
    } else {
      setError('סיסמה שגויה')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: '#0f0f0f' }}>
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20" style={{ background: '#891738', filter: 'blur(120px)' }} />

      <div className="glass-card p-10 w-full max-w-md relative z-10">
        <h1 className="text-3xl font-bold text-center mb-1 gold-gradient">בית חב״ד לימסול</h1>
        <h2 className="text-lg text-center opacity-40 mb-8">מרכז שליטה</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm opacity-50 mb-2">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 rounded-xl border transition-all focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.1)',
              }}
              onFocus={(e) => e.target.style.borderColor = '#891738'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              placeholder="הכנס סיסמה..."
              autoFocus
            />
          </div>

          {error && <p className="text-sm" style={{ color: '#ff6b6b' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 font-bold rounded-xl transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #891738 0%, #a01d45 100%)',
            }}
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  )
}
