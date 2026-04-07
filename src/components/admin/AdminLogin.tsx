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
    <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: '#f5f5f5' }}>
      <div className="p-10 w-full max-w-md rounded-2xl shadow-lg" style={{ background: '#ffffff' }}>
        <h1 className="text-3xl font-bold text-center mb-1" style={{ color: '#891738' }}>בית חב״ד לימסול</h1>
        <h2 className="text-lg text-center mb-8" style={{ color: '#666' }}>מרכז שליטה</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm mb-2" style={{ color: '#555' }}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 rounded-xl border transition-all focus:outline-none"
              style={{
                background: '#f9f9f9',
                borderColor: '#ddd',
                color: '#333',
              }}
              onFocus={(e) => e.target.style.borderColor = '#891738'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
              placeholder="הכנס סיסמה..."
              autoFocus
            />
          </div>

          {error && <p className="text-sm" style={{ color: '#e53e3e' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 font-bold rounded-xl transition-all disabled:opacity-50 text-white"
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
