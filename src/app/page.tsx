'use client'

import { useState } from 'react'
import { Instagram } from 'lucide-react'

const XIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size}`} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
)
const TikTokIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size}`} fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.78a8.18 8.18 0 003.76.92V6.27a4.86 4.86 0 01-3.77-.01l-.23.43z"/></svg>
)
const ThreadsIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161"/></svg>
)

export default function HomePage() {
  const [code, setCode] = useState('')

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    window.location.href = `/login?invite=${encodeURIComponent(trimmed)}`
  }

  const handleOAuth = (provider: 'google' | 'discord' | 'apple') => {
    const url = new URL(`/api/auth/oauth/${provider}`, window.location.origin)
    if (code.trim()) url.searchParams.set('invite', code.trim().toUpperCase())
    window.location.href = url.toString()
  }

  return (
    <>
      <style>{`
        @keyframes blob-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.08); }
        }
        .blob-pink {
          position: fixed; top: 80px; left: 40px;
          width: 320px; height: 320px;
          background: #f9a8d4; border-radius: 50%;
          filter: blur(90px); opacity: 0.35;
          animation: blob-pulse 5s ease-in-out infinite;
          pointer-events: none; z-index: 0;
        }
        .blob-purple {
          position: fixed; bottom: 80px; right: 40px;
          width: 320px; height: 320px;
          background: #c4b5fd; border-radius: 50%;
          filter: blur(90px); opacity: 0.35;
          animation: blob-pulse 5s ease-in-out infinite 2.5s;
          pointer-events: none; z-index: 0;
        }
      `}</style>

      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#1a1a1a', minHeight: '100vh', background: 'linear-gradient(135deg, #fdf2f8 0%, #faf5ff 50%, #eff6ff 100%)', display: 'flex', flexDirection: 'column' }}>
        <div className="blob-pink" />
        <div className="blob-purple" />

        {/* Nav */}
        <nav style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #ec4899, #a855f7)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(236,72,153,0.3)' }}>
              <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 18 }}>GirlyPopChat</span>
          </div>
          <div style={{ display: 'flex', gap: 16, color: '#9ca3af' }}>
            <a href="https://instagram.com/girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><Instagram size={20} /></a>
            <a href="https://x.com/girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><XIcon /></a>
            <a href="https://tiktok.com/@girlypopchat.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><TikTokIcon /></a>
            <a href="https://www.threads.com/@girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><ThreadsIcon /></a>
          </div>
        </nav>

        {/* Main */}
        <main style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ maxWidth: 440, width: '100%' }}>

            {/* Headline */}
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fce7f3', color: '#be185d', padding: '5px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
                🔒 Closed Beta
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 14 }}>
                For Bad Bitches,{' '}
                <span style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Mermaids & Slay Queens
                </span>
              </h1>
              <p style={{ color: '#666', fontSize: 16, lineHeight: 1.6 }}>
                GirlyPopChat is live — but invite-only. Enter your code to get in.
              </p>
            </div>

            {/* Card */}
            <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', padding: 32 }}>
              <form onSubmit={handleContinue} style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Invite Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER YOUR CODE"
                  autoFocus
                  style={{ width: '100%', padding: '16px', border: '2px solid #fbcfe8', borderRadius: 12, fontSize: 22, textAlign: 'center', letterSpacing: '0.15em', fontFamily: 'monospace', fontWeight: 700, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s', color: '#1a1a1a' }}
                  onFocus={e => { e.target.style.borderColor = '#ec4899'; e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = '#fbcfe8'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="submit"
                  disabled={!code.trim()}
                  style={{ width: '100%', marginTop: 12, padding: '14px', background: code.trim() ? 'linear-gradient(135deg, #ec4899, #a855f7)' : '#e5e7eb', color: code.trim() ? 'white' : '#9ca3af', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: code.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                >
                  Continue →
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
                <span style={{ fontSize: 12, color: '#9ca3af' }}>or sign in with</span>
                <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
              </div>

              <button
                onClick={() => handleOAuth('google')}
                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 500 }}
              >
                <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 20 }}>
              Already a member?{' '}
              <a href="/login" style={{ color: '#ec4899', textDecoration: 'none', fontWeight: 500 }}>Sign in here</a>
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(0,0,0,0.06)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>© 2026 GirlyPopChat · 18+ only</span>
          <div style={{ display: 'flex', gap: 16, color: '#9ca3af' }}>
            <a href="https://instagram.com/girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><Instagram size={17} /></a>
            <a href="https://x.com/girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><XIcon size={4} /></a>
            <a href="https://tiktok.com/@girlypopchat.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><TikTokIcon size={4} /></a>
            <a href="https://www.threads.com/@girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><ThreadsIcon /></a>
          </div>
        </footer>
      </div>
    </>
  )
}
