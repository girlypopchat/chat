'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Instagram } from 'lucide-react'

const ThreadsIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161"/></svg>
)
const XIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size}`} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
)
const TikTokIcon = ({ size = 5 }: { size?: number }) => (
  <svg className={`w-${size} h-${size}`} fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.78a8.18 8.18 0 003.76.92V6.27a4.86 4.86 0 01-3.77-.01l-.23.43z"/></svg>
)

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(false)
  const [position, setPosition] = useState(0)
  const [myReferralCode, setMyReferralCode] = useState('')
  const [totalSignups, setTotalSignups] = useState(0)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setReferralCode(ref)
  }, [])

  useEffect(() => {
    fetch('/api/waitlist').then(r => r.json()).then(d => setTotalSignups(d.total || 0)).catch(() => {})
  }, [joined])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, referralCode: referralCode || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join')
      setPosition(data.position)
      setMyReferralCode(data.referralCode)
      setJoined(true)
      if (data.alreadyJoined) toast.info("You're already on the list!")
      else toast.success("You're on the list!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <>
      <style>{`
        @keyframes blob-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.75; }
          100% { transform: scale(2); opacity: 0; }
        }
        .blob-pink {
          position: absolute; top: 80px; left: 40px;
          width: 300px; height: 300px;
          background: #f9a8d4; border-radius: 50%;
          filter: blur(80px); opacity: 0.4;
          animation: blob-pulse 4s ease-in-out infinite;
          pointer-events: none;
        }
        .blob-purple {
          position: absolute; bottom: 80px; right: 40px;
          width: 300px; height: 300px;
          background: #c4b5fd; border-radius: 50%;
          filter: blur(80px); opacity: 0.4;
          animation: blob-pulse 4s ease-in-out infinite 2s;
          pointer-events: none;
        }
        .gradient-text {
          background: linear-gradient(135deg, #ec4899, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        input:focus { outline: none; border-color: #ec4899 !important; box-shadow: 0 0 0 3px rgba(236,72,153,0.1); }
        .comparison-item { border-left: 3px solid #ec4899; }
        .bad-item { border-left: 3px solid #e5e5e5; }
      `}</style>

      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: '#1a1a1a' }}>

        {/* HERO */}
        <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #fdf2f8 0%, #faf5ff 50%, #eff6ff 100%)', padding: '80px 20px 100px', textAlign: 'center' }}>
          <div className="blob-pink" />
          <div className="blob-purple" />
          <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #ec4899, #a855f7)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(236,72,153,0.3)' }}>
                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/></svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: 20 }}>GirlyPopChat</span>
              </div>
              <div style={{ display: 'flex', gap: 16, color: '#9ca3af' }}>
                <a href="https://instagram.com/girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><Instagram size={20} /></a>
                <a href="https://x.com/girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><XIcon /></a>
                <a href="https://tiktok.com/@girlypopchat.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><TikTokIcon /></a>
                <a href="https://www.threads.com/@girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><ThreadsIcon /></a>
              </div>
            </div>

            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fce7f3', color: '#be185d', padding: '6px 14px', borderRadius: 50, fontSize: 13, fontWeight: 500, marginBottom: 24 }}>
              ⚡ Launching Late March / Early April 2026
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: 'clamp(2rem, 7vw, 4rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
              For Bad Bitches, Mermaids,{' '}
              <span className="gradient-text">Unicorns, Fairies &amp; Slay Queens</span>
            </h1>

            <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#666', marginBottom: 16, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              Video chat for pixies, sprites, goddesses, witches, sirens, and every other kind of magical creature. Body-positive, women-first, open to anyone who brings good vibes.
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#db2777', marginBottom: 32 }}>
              We&apos;re launching soon — join the waitlist now to secure your spot for early access.
            </p>

            {/* Social proof */}
            {totalSignups > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
                <div style={{ display: 'flex' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${i % 2 === 0 ? '#f472b6' : '#a78bfa'}, ${i % 2 === 0 ? '#a78bfa' : '#f472b6'})`, border: '2px solid white', marginLeft: i === 0 ? 0 : -8 }} />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10 }}>
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#ec4899', opacity: 0.75, animation: 'ping-slow 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                    <span style={{ position: 'relative', width: 10, height: 10, borderRadius: '50%', background: '#ec4899', display: 'inline-block' }} />
                  </span>
                  <span style={{ fontSize: 14, color: '#555' }}><strong style={{ color: '#1a1a1a' }}>{totalSignups.toLocaleString()}</strong> {totalSignups === 1 ? 'person has' : 'people have'} joined the waitlist</span>
                </div>
              </div>
            )}

            {/* Form / Success */}
            <div ref={formRef}>
              {!joined ? (
                <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', maxWidth: 420, margin: '0 auto', padding: 32 }}>
                  <h2 style={{ fontSize: 20, marginBottom: 4 }}>Get early access</h2>
                  <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>We&apos;re launching late March / early April — claim your spot now.</p>
                  <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '14px 16px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 16, marginBottom: 12 }} />
                  <div style={{ marginBottom: 16 }}>
                    <input type="text" placeholder="Referral code (optional)" value={referralCode} onChange={e => setReferralCode(e.target.value)} style={{ width: '100%', padding: '14px 16px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 16, marginBottom: 6 }} />
                    <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'left' }}>Got a code from a friend? Enter it here and you&apos;ll both move up the list. No code? No worries — you&apos;ll get one to share when you sign up.</p>
                  </div>
                  <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #ec4899, #a855f7)', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Joining...' : 'Claim Your Spot →'}
                  </button>
                </form>
              ) : (
                <div style={{ maxWidth: 480, margin: '0 auto' }}>
                  <div style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', color: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(236,72,153,0.3)', padding: 32, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>✓</div>
                    <h3 style={{ fontSize: 24, marginBottom: 8 }}>You&apos;re on the list!</h3>
                    <p style={{ opacity: 0.9 }}>Position <strong>#{position}</strong> — we&apos;ll email you when it&apos;s your turn.</p>
                  </div>

                  <div style={{ background: 'white', border: '2px solid #fce7f3', borderRadius: 16, padding: 28, textAlign: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>🎁 Now spread the word</h3>
                    <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Share your link — every friend who signs up moves you closer to the front. Hit 5 and you&apos;re in instantly with exclusive cosmetics.</p>
                    <div style={{ background: '#fdf2f8', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Your referral code</p>
                      <div style={{ fontSize: 48, fontWeight: 900, fontFamily: 'monospace', color: '#ec4899', letterSpacing: '0.1em', marginBottom: 16 }}>{myReferralCode}</div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Or share this link</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input readOnly value={`https://girlypopchat.com/?ref=${myReferralCode}`} style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 13, background: 'white', color: '#555' }} />
                        <button type="button" onClick={() => { navigator.clipboard.writeText(`https://girlypopchat.com/?ref=${myReferralCode}`); toast.success('Link copied!') }} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #ec4899, #a855f7)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>Copy</button>
                      </div>
                    </div>
                    <div style={{ background: '#fdf2f8', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#555' }}>
                      <strong>Rewards:</strong> 3 friends = jump the queue &bull; 5 friends = instant access + exclusive badge &bull; 10 friends = limited cosmetics pack
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* COMPARISON */}
        <section style={{ background: '#fafafa', padding: '80px 20px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, marginBottom: 48 }}>Why not just use anything else?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#999', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Other video chats</h3>
                {[
                  'Random creeps joining your stream',
                  'Bots spamming the chat',
                  'Getting banned for no reason',
                  'Your data sold to advertisers',
                  'Screenshot leaks with no recourse',
                ].map((item, i) => (
                  <div key={i} className="bad-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'white', borderRadius: 8, marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span>🚩</span><span style={{ fontSize: 14 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#ec4899', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>GirlyPopChat</h3>
                {[
                  'View requests need your approval',
                  'Invite-only keeps bots and creeps out',
                  'Transparent rules, fair warnings',
                  'End-to-end encrypted, zero data selling',
                  'Screenshots blocked. Your content stays yours.',
                ].map((item, i) => (
                  <div key={i} className="comparison-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'white', borderRadius: 8, marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span>✅</span><span style={{ fontSize: 14 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ padding: '80px 20px', background: 'white' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, marginBottom: 8 }}>Built different</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: 48 }}>Everything you wish other platforms had.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
              {[
                { icon: '💖', title: 'Body Positivity', desc: 'Every body is celebrated here. Show up exactly as you are — no filters, no judgment.' },
                { icon: '👑', title: 'Women First', desc: 'Built by women, for women — and welcoming to everyone who respects the vibe.' },
                { icon: '🔐', title: 'End-to-End Encrypted', desc: 'Your streams, chats, and data are encrypted. What happens here stays here.' },
                { icon: '🙈', title: 'Private by Default', desc: 'No tracking, no data selling, no screenshots. Your identity and content stay yours.' },
                { icon: '✨', title: 'Self Expression', desc: 'Your body, your rules. Show off, be bold, be free — this is your stage.' },
                { icon: '🌈', title: 'Zero Discrimination', desc: 'All genders, all sizes, all backgrounds. If you\'re kind, you belong here.' },
              ].map((f, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 28, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #fce7f3' }}>
                  <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(168,85,247,0.1))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OUR PROMISE */}
        <section style={{ background: 'linear-gradient(135deg, #fdf2f8, #faf5ff)', padding: '80px 20px' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, marginBottom: 20 }}>Our Promise</h2>
            <p style={{ fontSize: 16, color: '#555', lineHeight: 1.8 }}>
              GirlyPopChat is built on one belief: <strong>your body is yours to celebrate</strong>. We&apos;re creating a space where women and everyone else can feel safe to be themselves, show off, and connect without fear of harassment or shame. Everything is end-to-end encrypted and we will never sell your data or let anyone screenshot your content. We don&apos;t discriminate based on size, shape, gender, or background. Freedom, positivity, and privacy aren&apos;t just values here — they&apos;re the whole point.
            </p>
          </div>
        </section>

        {/* REFERRAL */}
        <section style={{ padding: '80px 20px', background: 'white' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, marginBottom: 8 }}>Skip the Line</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: 40 }}>Here&apos;s how the referral system works</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, marginBottom: 32 }}>
              {[
                { num: '1', color: '#ec4899', title: 'Join the Waitlist', desc: 'Sign up with your email and get your own unique referral code.' },
                { num: '2', color: '#a855f7', title: 'Share Your Link', desc: 'Every friend who signs up with your code moves you closer to the front.' },
                { num: '3', color: '#ec4899', title: 'Unlock Rewards', desc: 'Hit 5 referrals for instant early access plus exclusive cosmetics you can\'t get any other way.' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.num}</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg, #fdf2f8, #faf5ff)', borderRadius: 10, padding: '14px 20px', textAlign: 'center', fontSize: 13, color: '#555' }}>
              <strong>Referral rewards:</strong> 3 friends = jump the queue &bull; 5 friends = instant early access + exclusive profile badge &bull; 10 friends = limited-edition cosmetics pack
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)', padding: '80px 20px', textAlign: 'center' }}>
          <h2 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, marginBottom: 16 }}>
            Ready to find your people?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 32, fontSize: 16 }}>
            No shame. No judgment. Just real ones celebrating each other.
          </p>
          <button onClick={scrollToForm} style={{ background: 'white', color: '#ec4899', border: 'none', padding: '14px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Join the Waitlist →
          </button>
        </section>

        {/* STATS */}
        <section style={{ background: '#fafafa', padding: '40px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 32, background: 'white', borderRadius: 16, padding: '20px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              {[
                { val: 'Late Mar', label: 'Launching' },
                { val: 'Free', label: 'To Join' },
                { val: '18+', label: 'Only' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  {i > 0 && <div style={{ position: 'absolute', width: 1, height: 32, background: '#e5e5e5' }} />}
                  <div style={{ fontSize: 22, fontWeight: 800, color: i % 2 === 0 ? '#ec4899' : '#a855f7' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: '1px solid #eee', padding: '32px 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" fill="#ec4899" viewBox="0 0 24 24"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/></svg>
              <span style={{ fontSize: 14, color: '#666' }}>© 2026 GirlyPopChat. All rights reserved.</span>
            </div>
            <div style={{ display: 'flex', gap: 20, color: '#9ca3af' }}>
              <a href="https://instagram.com/girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><Instagram size={18} /></a>
              <a href="https://x.com/girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><XIcon size={4} /></a>
              <a href="https://tiktok.com/@girlypopchat.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><TikTokIcon size={4} /></a>
              <a href="https://www.threads.com/@girlypopchat" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}><ThreadsIcon /></a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
