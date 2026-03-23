'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [code, setCode] = useState('')
  const [reqEmail, setReqEmail] = useState('')
  const [reqLoading, setReqLoading] = useState(false)
  const [reqDone, setReqDone] = useState(false)
  const [reqError, setReqError] = useState('')
  const router = useRouter()

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    router.push(`/login?invite=${encodeURIComponent(trimmed)}`)
  }

  const handleOAuth = (provider: 'google') => {
    const url = new URL(`/api/auth/oauth/${provider}`, window.location.origin)
    if (code.trim()) url.searchParams.set('invite', code.trim().toUpperCase())
    window.location.href = url.toString()
  }

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqEmail.trim()) return
    setReqLoading(true)
    setReqError('')
    try {
      const res = await fetch('/api/invite-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: reqEmail.trim() }),
      })
      const data = await res.json()
      if (data.success || data.alreadyRequested) {
        setReqDone(true)
      } else {
        setReqError(data.error || 'Something went wrong')
      }
    } catch {
      setReqError('Something went wrong. Try again.')
    } finally {
      setReqLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="absolute top-20 left-10 w-64 h-64 bg-pink-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-300 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://i.imgur.com/we7evYT.png" 
              alt="GirlyPopChat Logo" 
              className="w-14 h-14 rounded-2xl shadow-lg object-cover"
            />
            <span className="text-2xl font-bold">GirlyPopChat</span>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            🔒 Closed Beta
          </span>
        </div>

        {/* Invite code card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">You need an invite</h1>
            <p className="text-gray-500 text-sm">
              GirlyPopChat is invite-only right now. Enter your code to get in.
            </p>
          </div>

          <form onSubmit={handleContinue} className="space-y-3">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="INVITE CODE"
              autoFocus
              className="w-full py-4 px-4 border-2 border-pink-200 rounded-xl text-center text-2xl tracking-widest font-mono font-bold focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none placeholder:text-gray-300 placeholder:text-xl placeholder:tracking-widest"
            />
            <button
              type="submit"
              disabled={!code.trim()}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-40"
            >
              Continue →
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or sign in with</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            onClick={() => handleOAuth('google')}
            className="w-full py-2.5 px-3 border rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
        </div>

        {/* Request an invite */}
        <div className="mt-4 bg-white/70 backdrop-blur rounded-2xl border border-pink-100 p-6">
          <p className="text-center text-sm font-semibold text-gray-700 mb-1">Don't have a code?</p>
          <p className="text-center text-xs text-gray-500 mb-4">Drop your email and we'll send one when spots open up.</p>

          {reqDone ? (
            <div className="text-center py-2">
              <p className="text-sm font-medium text-pink-600">You're on the list! We'll reach out soon.</p>
            </div>
          ) : (
            <form onSubmit={handleRequest} className="flex gap-2">
              <input
                type="email"
                value={reqEmail}
                onChange={e => setReqEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 min-w-0 px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
              <button
                type="submit"
                disabled={reqLoading}
                className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 shrink-0"
              >
                {reqLoading ? '...' : 'Notify me'}
              </button>
            </form>
          )}
          {reqError && <p className="text-xs text-red-500 text-center mt-2">{reqError}</p>}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already a member?{' '}
          <a href="/login" className="text-pink-500 hover:underline">
            Sign in here
          </a>
        </p>

        <div className="flex justify-center gap-4 text-xs text-gray-400 mt-4">
          <a href="/terms" className="hover:underline">Terms of Service</a>
          <span>•</span>
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
        </div>
      </div>
    </main>
  )
}
