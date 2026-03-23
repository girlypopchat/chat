export const ROOM_TYPES = [
  { value: 'text', emoji: '💬', label: 'Text', desc: 'Classic chat room' },
  { value: 'video', emoji: '📹', label: 'Video-first', desc: 'Video fullscreen, chat in drawer' },
  { value: 'music', emoji: '🎵', label: 'Music', desc: 'YouTube queue with voting' },
  { value: 'cinema', emoji: '🎬', label: 'Cinema', desc: 'Screen share, legal content only' },
  { value: 'event', emoji: '🎪', label: 'Events', desc: 'Petition system with co-signers' },
  { value: 'rave', emoji: '🪩', label: 'Rave', desc: 'All video, no chat' },
  { value: 'library', emoji: '📚', label: 'Library', desc: 'All text, structured, quiet' },
] as const

export const ACCESS_MODES = [
  { value: 'public', emoji: '🌍', label: 'Public', desc: 'Anyone can join' },
  { value: 'password', emoji: '🔑', label: 'Password', desc: 'Requires a password to enter' },
  { value: 'secret', emoji: '🤫', label: 'Secret', desc: 'Invite-only, hidden from list' },
] as const

export const VIBE_PRESETS = [
  { value: 'cozy', emoji: '🧸', label: 'Cozy', desc: 'Warm pastels, relaxed pace', colors: { bg: 'from-amber-50 to-orange-50', accent: 'amber' } },
  { value: 'party', emoji: '🎉', label: 'Party', desc: 'Bright colors, fast energy', colors: { bg: 'from-pink-50 to-purple-50', accent: 'pink' } },
  { value: 'focus', emoji: '🎯', label: 'Focus', desc: 'Muted tones, clean layout', colors: { bg: 'from-slate-50 to-blue-50', accent: 'blue' } },
  { value: 'sleepover', emoji: '🌙', label: 'Sleepover', desc: 'Dark mode, soft purples', colors: { bg: 'from-indigo-50 to-violet-50', accent: 'violet' } },
] as const

export type RoomType = typeof ROOM_TYPES[number]['value']
export type AccessMode = typeof ACCESS_MODES[number]['value']
export type VibePreset = typeof VIBE_PRESETS[number]['value']
