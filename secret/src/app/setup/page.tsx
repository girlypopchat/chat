'use client'

import { useState, useMemo } from 'react'
import { LAST_NAMES, GENDER_ICONS, type LastNameOption } from '@/lib/last-names'

const DISPLAY_MODES = [
  { value: 'full', label: 'Full name', example: (f: string, l: LastNameOption | null) => l ? `${f} ${l.name} ${l.emoji}` : f },
  { value: 'first_only', label: 'First name only', example: (f: string) => f },
  { value: 'first_emoji', label: 'First name + emoji', example: (f: string, l: LastNameOption | null) => l ? `${f} ${l.emoji}` : f },
  { value: 'first_last', label: 'First + last name', example: (f: string, l: LastNameOption | null) => l ? `${f} ${l.name}` : f },
] as const

const CATEGORIES: Record<string, string[]> = {
  'Nature': ['Petal', 'Blossom', 'Bloom', 'Daisy', 'Rose', 'Lily', 'Ivy', 'Fern', 'Willow', 'Clover', 'Meadow', 'Sage', 'Juniper', 'Maple', 'Jasmine', 'Violet', 'Poppy', 'Laurel'],
  'Celestial': ['Starlight', 'Moonbeam', 'Stardust', 'Eclipse', 'Nova', 'Comet', 'Aurora', 'Twilight', 'Solstice', 'Nebula', 'Celestia', 'Cosmos'],
  'Sweet': ['Mochi', 'Honey', 'Sugar', 'Cherry', 'Peach', 'Latte', 'Cookie', 'Caramel', 'Berry', 'Matcha', 'Strawberry', 'Macaron', 'Boba', 'Truffle'],
  'Magical': ['Whisper', 'Dream', 'Phantom', 'Mystic', 'Charm', 'Spell', 'Glimmer', 'Shimmer', 'Spark', 'Haze', 'Mirage', 'Pixie', 'Fairy', 'Spirit', 'Aura'],
  'Elements': ['Rain', 'Storm', 'Frost', 'Snow', 'Breeze', 'Cloud', 'Ember', 'Flame', 'Crystal', 'Pearl', 'Opal', 'Jade', 'Coral', 'Ocean', 'Tide', 'Dew'],
  'Creatures': ['Dove', 'Fox', 'Bunny', 'Kitty', 'Moth', 'Butterfly', 'Firefly', 'Swan', 'Robin', 'Starling', 'Fawn'],
  'Aesthetic': ['Velvet', 'Silk', 'Lace', 'Ribbon', 'Blush', 'Dusk', 'Dawn', 'Lullaby', 'Melody', 'Echo', 'Reverie', 'Serenity', 'Solace', 'Haven', 'Harbor', 'Cove'],
}

export default function SetupPage() {
  const [firstName, setFirstName] = useState('')
  const [selectedLastName, setSelectedLastName] = useState<LastNameOption | null>(null)
  const [genderIcon, setGenderIcon] = useState<string | null>(null)
  const [displayMode, setDisplayMode] = useState('full')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredNames = useMemo(() => {
    let names = LAST_NAMES
    if (search) {
      const q = search.toLowerCase()
      names = names.filter(n => n.name.toLowerCase().includes(q))
    }
    if (activeCategory) {
      const catNames = CATEGORIES[activeCategory] || []
      names = names.filter(n => catNames.includes(n.name))
    }
    return names
  }, [search, activeCategory])

  const preview = useMemo(() => {
    const f = firstName.trim() || 'Your'
    const mode = DISPLAY_MODES.find(m => m.value === displayMode) || DISPLAY_MODES[0]
    const base = mode.example(f, selectedLastName)
    return genderIcon ? `${genderIcon} ${base}` : base
  }, [firstName, selectedLastName, genderIcon, displayMode])

  const handleSubmit = async () => {
    if (!firstName.trim() || !selectedLastName) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: selectedLastName.name,
          genderIcon,
          displayMode,
        }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.href = '/chat'
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">{'✨'}</span>
          </div>
          <h1 className="text-2xl font-bold">Create Your Identity</h1>
          <p className="text-gray-600 mt-1">Pick a name that feels like you.</p>
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 text-center">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Preview</div>
          <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            {preview}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Whatever you want, babe"
              maxLength={30}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-lg"
            />
          </div>

          {/* Last Name Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name <span className="text-gray-400 font-normal">(pick from the menu)</span>
            </label>

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveCategory(null) }}
              placeholder="Search names..."
              className="w-full px-3 py-2 border rounded-lg mb-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
            />

            {/* Category Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2">
              <button
                onClick={() => { setActiveCategory(null); setSearch('') }}
                className={'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ' +
                  (!activeCategory ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
              >
                All
              </button>
              {Object.keys(CATEGORIES).map(cat => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setSearch('') }}
                  className={'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ' +
                    (activeCategory === cat ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Name Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
              {filteredNames.map(ln => (
                <button
                  key={ln.name}
                  onClick={() => setSelectedLastName(ln)}
                  className={'p-2 rounded-xl text-sm font-medium transition-all text-center ' +
                    (selectedLastName?.name === ln.name
                      ? 'bg-pink-100 border-2 border-pink-400 shadow-sm'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300')}
                >
                  <div className="text-lg">{ln.emoji}</div>
                  <div className="text-xs mt-0.5">{ln.name}</div>
                </button>
              ))}
              {filteredNames.length === 0 && (
                <div className="col-span-full text-center py-6 text-gray-400 text-sm">
                  No names match your search
                </div>
              )}
            </div>
          </div>

          {/* Gender Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender Icon <span className="text-gray-400 font-normal">(optional, no one polices this)</span>
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How should others see your name?
            </label>
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
                    {mode.example(firstName.trim() || 'Luna', selectedLastName || LAST_NAMES[0])}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!firstName.trim() || !selectedLastName || loading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? 'Setting up...' : "That's me! Let's go"}
          </button>
        </div>
      </div>
    </main>
  )
}
