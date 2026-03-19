'use client'

import { useState, useEffect } from 'react'
import { StytchUIClient } from '@stytch/vanilla-js'

const stytchClient = typeof window !== 'undefined'
  ? new StytchUIClient(process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN!)
  : null as any

export default function HomePage() {
  const [count, setCount] = useState(247)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [code, setCode] = useState('')

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    
    // Simulate API call
    await new Promise(r => setTimeout(r, 800))
    
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    setCode(newCode)
    setJoined(true)
    setCount(c => c + 1)
    setLoading(false)
  }

  const handleOAuth = (provider: 'google' | 'discord' | 'apple') => {
    const redirectUrl = `${window.location.origin}/api/auth/callback`
    stytchClient.oauth[provider].start({
      login_redirect_url: redirectUrl,
      signup_redirect_url: redirectUrl,
    })
  }

  if (joined) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-8 text-center text-white shadow-xl">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
            <h1 className="text-2xl font-bold mb-2">You're on the list!</h1>
            <p className="opacity-90">Position #{count} on the waitlist</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg border-2 border-pink-200">
            <p className="text-sm text-gray-600 mb-2">🎁 Your referral code:</p>
            <code className="block bg-gray-100 px-4 py-2 rounded-lg text-xl font-bold text-pink-600">{code}</code>
            <p className="text-xs text-gray-500 mt-2">Share to skip the line!</p>
          </div>
          <button 
            onClick={() => window.location.href = '/login'}
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Continue to Sign In →
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-pink-300 rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-300 rounded-full blur-3xl opacity-40 animate-pulse" />
        
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xl">✨</span>
            </div>
            <span className="font-bold text-2xl">GirlyPopChat</span>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-1 rounded-full text-sm mb-6">
            🕐 Launching 2024
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Video chat that doesn't{' '}
            <span className="gradient-text">suck</span>
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            An invite-only community. No trolls. No bots. No weirdos. Just vibes.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
            <div className="flex -space-x-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 border-2 border-white" />
              ))}
            </div>
            <span><strong>{count}</strong> on the waitlist</span>
          </div>

          {/* Sign Up */}
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-1">Get early access</h2>
            <p className="text-sm text-gray-500 mb-4">First 500 get founder status</p>
            
            <form onSubmit={handleJoin} className="space-y-3 mb-6">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                required
              />
              <input
                type="text"
                placeholder="Referral code (optional)"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 gradient-bg text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Claim Your Spot →'}
              </button>
            </form>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500">or sign in with</span></div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleOAuth('google')}
                className="py-2 px-4 border rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Google
              </button>
              <button 
                onClick={() => handleOAuth('discord')}
                className="py-2 px-4 border rounded-lg hover:bg-gray-50 transition font-medium text-indigo-600"
              >
                Discord
              </button>
              <button 
                onClick={() => handleOAuth('apple')}
                className="py-2 px-4 border rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Apple
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Actually useful features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🛡️', title: 'Invite-Only', desc: 'Every member needs a referral. Keeps trolls out.' },
              { icon: '⭐', title: 'Trust Scores', desc: 'Earn reputation. Know who\'s legit before you chat.' },
              { icon: '📹', title: 'Approve Viewers', desc: 'Broadcasting? You choose who watches.' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 text-center shadow-md">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-500 border-t">
        <p>© 2024 GirlyPopChat • Made with 💖 • 18+ only</p>
        <p className="mt-2 space-x-4">
          <a href="/privacy" className="hover:text-pink-500 underline">Privacy Policy</a>
          <a href="/terms" className="hover:text-pink-500 underline">Terms of Service</a>
        </p>
      </footer>
    </main>
  )
}
