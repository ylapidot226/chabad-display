'use client'

import { useState, useEffect } from 'react'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if already logged in by making a test request
    fetch('/api/media')
      .then((res) => {
        setIsAuthenticated(res.ok)
        setChecking(false)
      })
      .catch(() => setChecking(false))
    // Simple approach: just show login, cookie will be sent on API calls
    setChecking(false)
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-xl">טוען...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />
  }

  return <AdminDashboard />
}
