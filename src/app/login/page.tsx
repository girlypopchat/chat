'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginInner() {
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [authError, setAuthError] = useState('')

  const searchParams = useSearchParams()

  useEffect(() => {
    const err = searchParams.get('error')
    const code = searchParams.get('invite')
    if (code) setInviteCode(code)
    if (err === 'closed') {
      setAuthError('Registration is closed. Only existing users can sign in right now.')
    } else if (err === 'invalid_invite') {
      setAuthError('Invalid or expired invite code.')
    } else if (err === 'invite_required') {
      setAuthError('An invite code is required for beta access.')
    } else if (err) {
      setAuthError('Sign in failed. Please try again.')
    }
  }, [searchParams])

  const handleOAuth = (provider: 'google') => {
    const url = new URL(`/api/auth/oauth/${provider}`, window.location.origin)
    if (inviteCode.trim()) url.searchParams.set('invite', inviteCode.trim())
    window.location.href = url.toString()
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setEmailLoading(true)
    setEmailError('')

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(),
          inviteCode: inviteCode.trim() 
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEmailSent(true)
      } else {
        setEmailError(data.error || 'Failed to send link')
      }
    } catch {
      setEmailError('Something went wrong. Try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-3xl">✨</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">GirlyPopChat</h1>
          <p className="text-gray-500 text-sm font-medium tracking-wide uppercase text-xs">Closed Beta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm text-center">
              {authError}
            </div>
          )}

          {emailSent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📬</div>
              <h3 className="font-semibold text-lg">Check your email!</h3>
              <p className="text-gray-600 text-sm mt-1">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <p className="text-gray-400 text-xs mt-3">
                Didn't get it?{' '}
                <button
                  onClick={() => { setEmailSent(false); setEmailError('') }}
                  className="text-pink-500 hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 mb-4">
                <h2 className="text-lg font-semibold text-center mb-2">Beta Access</h2>
                <p className="text-center text-gray-600 text-sm">
                  Enter your invite code to join the beta
                </p>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invite Code</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="YOUR-CODE-HERE"
                    className="w-full py-3 px-4 border-2 border-pink-300 rounded-lg text-center text-xl tracking-wider font-mono focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full py-3 px-4 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
                
                {emailError && (
                  <p className="text-xs text-red-500 text-center">{emailError}</p>
                )}
                
                <button
                  type="submit"
                  disabled={emailLoading || !email.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50"
                >
                  {emailLoading ? 'Sending...' : 'Continue with Email'}
                </button>
              </form>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or sign in with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                onClick={() => handleOAuth('google')}
                className="w-full py-3 px-4 border rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have a code?{' '}
          <span className="text-gray-400">GirlyPopChat is invite-only.</span>
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
