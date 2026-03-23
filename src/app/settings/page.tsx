'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { LAST_NAMES, GENDER_ICONS, type LastNameOption } from '@/lib/last-names'

const DISPLAY_MODES = [
  { value: 'full', label: 'Full name', example: (f: string, l: string, e: string) => `${f} ${l} ${e}` },
  { value: 'first_only', label: 'First name only', example: (f: string) => f },
  { value: 'first_emoji', label: 'First + emoji', example: (f: string, _l: string, e: string) => `${f} ${e}` },
  { value: 'first_last', label: 'First + last', example: (f: string, l: string) => `${f} ${l}` },
]

const PRIVACY_MODES = [
  { value: 'open', emoji: '🟢', label: 'Open', desc: 'Your circle can see your camera' },
  { value: 'private', emoji: '🟡', label: 'Private', desc: 'People must ask to view' },
  { value: 'invisible', emoji: '🔴', label: 'Invisible', desc: 'Invite only' },
]

const DM_OPTIONS = [
  { value: 'anyone', label: 'Anyone' },
  { value: 'moots', label: 'Moots only' },
  { value: 'besties', label: 'Besties only' },
  { value: 'nobody', label: 'Nobody' },
]

const CATEGORIES: Record<string, string[]> = {
  'Nature': ['Petal', 'Blossom', 'Bloom', 'Daisy', 'Rose', 'Lily', 'Ivy', 'Fern', 'Willow', 'Clover', 'Meadow', 'Sage', 'Juniper', 'Maple', 'Jasmine', 'Violet', 'Poppy', 'Laurel'],
  'Celestial': ['Starlight', 'Moonbeam', 'Stardust', 'Eclipse', 'Nova', 'Comet', 'Aurora', 'Twilight', 'Solstice', 'Nebula', 'Celestia', 'Cosmos'],
  'Sweet': ['Mochi', 'Honey', 'Sugar', 'Cherry', 'Peach', 'Latte', 'Cookie', 'Caramel', 'Berry', 'Matcha', 'Strawberry', 'Macaron', 'Boba', 'Truffle'],
  'Magical': ['Whisper', 'Dream', 'Phantom', 'Mystic', 'Charm', 'Spell', 'Glimmer', 'Shimmer', 'Spark', 'Haze', 'Mirage', 'Pixie', 'Fairy', 'Spirit', 'Aura'],
  'Elements': ['Rain', 'Storm', 'Frost', 'Snow', 'Breeze', 'Cloud', 'Ember', 'Flame', 'Crystal', 'Pearl', 'Opal', 'Jade', 'Coral', 'Ocean', 'Tide', 'Dew'],
  'Creatures': ['Dove', 'Fox', 'Bunny', 'Kitty', 'Moth', 'Butterfly', 'Firefly', 'Swan', 'Robin', 'Starling', 'Fawn'],
  'Aesthetic': ['Velvet', 'Silk', 'Lace', 'Ribbon', 'Blush', 'Dusk', 'Dawn', 'Lullaby', 'Melody', 'Echo', 'Reverie', 'Serenity', 'Solace', 'Haven', 'Harbor', 'Cove'],
}

type SettingsTab = 'identity' | 'privacy' | 'camera'

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('identity')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Identity state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [lastNameEmoji, setLastNameEmoji] = useState('')
  const [genderIcon, setGenderIcon] = useState<string | null>(null)
  const [displayMode, setDisplayMode] = useState('full')
  const [bio, setBio] = useState('')
  const [nameSearch, setNameSearch] = useState('')
  const [nameCategory, setNameCategory] = useState<string | null>(null)

  // Privacy state
  const [privacyMode, setPrivacyMode] = useState('open')
  const [allowDmsFrom, setAllowDmsFrom] = useState('moots')
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)
  const [identityLocked, setIdentityLocked] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (!data.user) { window.location.href = '/login'; return }
        const u = data.user
        setFirstName(u.firstName || '')
        setLastName(u.lastName || '')
        setLastNameEmoji(u.lastNameEmoji || '')
        setGenderIcon(u.genderIcon || null)
        setDisplayMode(u.displayMode || 'full')
        setBio(u.bio || '')
        setPrivacyMode(u.privacyMode || 'open')
        setAllowDmsFrom(u.allowDmsFrom || 'moots')
        setShowOnlineStatus(u.showOnlineStatus !== false)
        // Lock identity if already set (can't change first/last name after setup)
        setIdentityLocked(u.identitySetup === true)
      })
      .catch(() => window.location.href = '/login')
      .finally(() => setLoading(false))
  }, [])

  const filteredNames = useMemo(() => {
    let names = LAST_NAMES
    if (nameSearch) {
      const q = nameSearch.toLowerCase()
      names = names.filter(n => n.name.toLowerCase().includes(q))
    }
    if (nameCategory) {
      const catNames = CATEGORIES[nameCategory] || []
      names = names.filter(n => catNames.includes(n.name))
    }
    return names
  }, [nameSearch, nameCategory])

  const preview = useMemo(() => {
    const f = firstName || 'Name'
    const l = lastName || 'Last'
    const e = lastNameEmoji || ''
    const mode = DISPLAY_MODES.find(m => m.value === displayMode) || DISPLAY_MODES[0]
    const base = mode.example(f, l, e)
    return genderIcon ? `${genderIcon} ${base}` : base
  }, [firstName, lastName, lastNameEmoji, genderIcon, displayMode])

  const save = async (fields: Record<string, any>) => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {}
    setSaving(false)
  }

  const saveIdentity = () => save({ firstName, lastName, genderIcon, displayMode, bio })
  const savePrivacy = () => save({ privacyMode, allowDmsFrom, showOnlineStatus })

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a href="/chat" className="p-2 hover:bg-white/60 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </a>
          <h1 className="text-xl font-bold">Settings</h1>
          {saved && (
            <span className="ml-auto flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/60 p-1 rounded-xl mb-6">
          {([
            { key: 'identity', label: 'Identity', emoji: '✨' },
            { key: 'privacy', label: 'Privacy', emoji: '🔒' },
            { key: 'camera', label: 'Camera', emoji: '📸' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={'flex-1 py-2.5 rounded-lg text-sm font-medium transition ' +
                (tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Identity Tab */}
        {tab === 'identity' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            {/* Preview */}
            <div className="text-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
              <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Display Name Preview</div>
              <div className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                {preview}
              </div>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name {identityLocked && <span className="text-xs text-gray-400">(locked)</span>}</label>
              <input
                type="text"
                value={firstName}
                onChange={e => !identityLocked && setFirstName(e.target.value)}
                maxLength={30}
                disabled={identityLocked}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name {identityLocked && <span className="text-xs text-gray-400">(locked)</span>}</label>
              {identityLocked ? (
                <div className="p-3 bg-gray-100 rounded-xl text-center font-medium">
                  {lastName} {lastNameEmoji}
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={nameSearch}
                    onChange={e => { setNameSearch(e.target.value); setNameCategory(null) }}
                    placeholder="Search names..."
                    className="w-full px-3 py-2 border rounded-lg mb-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                  <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2">
                    <button
                      onClick={() => { setNameCategory(null); setNameSearch('') }}
                      className={'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ' +
                        (!nameCategory ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                    >All</button>
                    {Object.keys(CATEGORIES).map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setNameCategory(cat); setNameSearch('') }}
                        className={'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ' +
                          (nameCategory === cat ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                      >{cat}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                    {filteredNames.map(ln => (
                      <button
                        key={ln.name}
                        onClick={() => { setLastName(ln.name); setLastNameEmoji(ln.emoji) }}
                        className={'p-2 rounded-xl text-sm font-medium transition-all text-center ' +
                          (lastName === ln.name
                            ? 'bg-pink-100 border-2 border-pink-400 shadow-sm'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100')}
                      >
                        <div className="text-lg">{ln.emoji}</div>
                        <div className="text-xs mt-0.5">{ln.name}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Gender Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender Icon</label>
              <div className="flex gap-3">
                {GENDER_ICONS.map(g => (
                  <button
                    key={g.icon}
                    onClick={() => setGenderIcon(genderIcon === g.icon ? null : g.icon)}
                    className={'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ' +
                      (genderIcon === g.icon
                        ? 'bg-pink-100 border-2 border-pink-400'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100')}
                  >
                    <span className="text-xl">{g.icon}</span>
                    <span className="text-sm">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {DISPLAY_MODES.map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setDisplayMode(mode.value)}
                    className={'p-3 rounded-xl text-left transition-all ' +
                      (displayMode === mode.value
                        ? 'bg-pink-100 border-2 border-pink-400'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100')}
                  >
                    <div className="text-sm font-medium">{mode.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {mode.example(firstName || 'Luna', lastName || 'Starlight', lastNameEmoji || '✨')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="Tell people about yourself..."
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none resize-none"
              />
              <div className="text-xs text-gray-400 text-right">{bio.length}/200</div>
            </div>

            <button
              onClick={saveIdentity}
              disabled={saving || !firstName.trim() || !lastName}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Identity'}
            </button>
          </div>
        )}

        {/* Privacy Tab */}
        {tab === 'privacy' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            {/* Global Privacy Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Camera Privacy Mode</label>
              <p className="text-xs text-gray-400 mb-3">Controls who can see your camera broadcast by default</p>
              <div className="space-y-2">
                {PRIVACY_MODES.map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setPrivacyMode(mode.value)}
                    className={'w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ' +
                      (privacyMode === mode.value
                        ? 'bg-pink-50 border-2 border-pink-400'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100')}
                  >
                    <span className="text-2xl">{mode.emoji}</span>
                    <div>
                      <div className="font-medium text-sm">{mode.label}</div>
                      <div className="text-xs text-gray-500">{mode.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* DM Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allow DMs from</label>
              <div className="grid grid-cols-2 gap-2">
                {DM_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAllowDmsFrom(opt.value)}
                    className={'p-3 rounded-xl text-sm font-medium transition-all ' +
                      (allowDmsFrom === opt.value
                        ? 'bg-pink-100 border-2 border-pink-400'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Online Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-sm">Show online status</div>
                <div className="text-xs text-gray-500">Let others see when you&apos;re active</div>
              </div>
              <button
                onClick={() => setShowOnlineStatus(!showOnlineStatus)}
                className={'relative w-12 h-7 rounded-full transition-colors ' +
                  (showOnlineStatus ? 'bg-pink-500' : 'bg-gray-300')}
              >
                <div className={'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ' +
                  (showOnlineStatus ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>

            <button
              onClick={savePrivacy}
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Privacy Settings'}
            </button>
          </div>
        )}

        {/* Camera Tab */}
        {tab === 'camera' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <div>
              <h3 className="font-medium text-sm text-gray-700 mb-2">Broadcast Indicators</h3>
              <p className="text-xs text-gray-400 mb-4">These show next to your name so others know your camera state</p>
              <div className="space-y-3">
                {[
                  { dot: 'bg-red-500', ring: 'ring-red-200', label: 'LIVE', desc: 'Broadcasting to viewers' },
                  { dot: 'bg-yellow-400', ring: 'ring-yellow-200', label: 'READY', desc: 'Camera on, no viewers yet' },
                  { dot: 'bg-green-500', ring: 'ring-green-200', label: 'HIDDEN', desc: 'Camera on, circle only' },
                  { dot: 'bg-gray-300', ring: 'ring-gray-200', label: 'PRESENT', desc: 'In room, camera off' },
                ].map(ind => (
                  <div key={ind.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className={'w-3 h-3 rounded-full ring-4 ' + ind.dot + ' ' + ind.ring} />
                    <div>
                      <div className="text-sm font-medium">{ind.label}</div>
                      <div className="text-xs text-gray-500">{ind.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-pink-50 rounded-xl">
              <h3 className="font-medium text-sm text-pink-700 mb-1">Panic Button</h3>
              <p className="text-xs text-pink-600">
                While broadcasting, tap the eye icon to instantly see who&apos;s watching. Available in the chat header when live.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-sm text-gray-700 mb-1">Viewing Rules</h3>
              <ul className="text-xs text-gray-500 space-y-1.5 mt-2">
                <li><strong>Same room</strong> &mdash; can always see your broadcast</li>
                <li><strong>Circle members</strong> &mdash; depends on your privacy mode (set in Privacy tab)</li>
                <li><strong>Invite</strong> &mdash; overrides all other rules</li>
                <li><strong>Whitelist/Blacklist</strong> &mdash; per-user exceptions (coming soon)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
