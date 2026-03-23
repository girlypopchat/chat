'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type CircleTier = 'none' | 'fan' | 'fave' | 'moot' | 'bestie'

const TIER_INFO: Record<CircleTier, { emoji: string; label: string; color: string }> = {
  none: { emoji: '', label: '', color: '' },
  fan: { emoji: '👋', label: 'Fan', color: 'bg-gray-100 text-gray-700' },
  fave: { emoji: '⭐', label: 'Fave', color: 'bg-yellow-100 text-yellow-700' },
  moot: { emoji: '🌸', label: 'Moot', color: 'bg-pink-100 text-pink-700' },
  bestie: { emoji: '💖', label: 'Bestie', color: 'bg-purple-100 text-purple-700' },
}

interface UserProfileCardProps {
  userId: string
  username: string
  displayName?: string
  avatar?: string
  genderIcon?: string
  currentUserId: string
  onClose: () => void
  onStartDm?: (userId: string) => void
  isLive?: boolean
  roomName?: string
  onViewCam?: (userId: string, roomName: string) => void
}

export default function UserProfileCard({
  userId,
  username,
  displayName,
  avatar,
  genderIcon,
  currentUserId,
  onClose,
  onStartDm,
  isLive,
  roomName,
  onViewCam,
}: UserProfileCardProps) {
  const [tier, setTier] = useState<CircleTier>('none')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [dmError, setDmError] = useState('')

  const isSelf = userId === currentUserId

  useEffect(() => {
    if (isSelf) { setLoading(false); return }
    fetch(`/api/circles/tier?userId=${userId}`)
      .then(r => r.json())
      .then(d => setTier(d.tier || 'none'))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, isSelf])

  const handleFollow = async () => {
    setActing(true)
    try {
      const res = await fetch('/api/circles/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: userId }),
      })
      const data = await res.json()
      if (data.tier) setTier(data.tier)
    } catch {}
    setActing(false)
  }

  const handleUnfollow = async () => {
    setActing(true)
    try {
      const res = await fetch('/api/circles/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: userId }),
      })
      const data = await res.json()
      if (data.tier) setTier(data.tier)
    } catch {}
    setActing(false)
  }

  const handleBestie = async () => {
    setActing(true)
    try {
      const res = await fetch('/api/circles/bestie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: userId }),
      })
      const data = await res.json()
      if (data.tier) setTier(data.tier)
    } catch {}
    setActing(false)
  }

  const isFollowing = tier === 'fave' || tier === 'moot' || tier === 'bestie'
  const isMutual = tier === 'moot' || tier === 'bestie'
  const tierInfo = TIER_INFO[tier]

  return (
    <div className="bg-white rounded-xl shadow-xl border w-72 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold ring-2 ring-white/40">
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              (displayName || username)[0].toUpperCase()
            )}
          </div>
          <div>
            <div className="font-semibold text-white">
              {genderIcon && <span className="mr-1">{genderIcon}</span>}
              {displayName || username}
            </div>
            <div className="text-white/70 text-sm">@{username}</div>
          </div>
        </div>
      </div>

      {/* Tier Badge */}
      {tier !== 'none' && !isSelf && (
        <div className="px-4 pt-3">
          <span className={'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ' + tierInfo.color}>
            {tierInfo.emoji} {tierInfo.label}
          </span>
        </div>
      )}

      {/* Actions */}
      {!isSelf && !loading && (
        <div className="p-4 space-y-2">
          {isFollowing ? (
            <>
              <button
                onClick={handleUnfollow}
                disabled={acting}
                className="w-full py-2 px-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                {acting ? '...' : 'Unfollow'}
              </button>
              {isMutual && (
                <button
                  onClick={handleBestie}
                  disabled={acting}
                  className={'w-full py-2 px-3 rounded-lg text-sm font-medium disabled:opacity-50 ' +
                    (tier === 'bestie'
                      ? 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
                      : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90')}
                >
                  {acting ? '...' : tier === 'bestie' ? '💖 Besties!' : '💖 Mark as Bestie'}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleFollow}
              disabled={acting}
              className="w-full py-2 px-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {acting ? '...' : tier === 'fan' ? '⭐ Follow back' : '⭐ Follow'}
            </button>
          )}

          {/* View Cam Button */}
          {isLive && roomName && onViewCam && (
            <button
              onClick={() => {
                onViewCam(userId, roomName)
                onClose()
              }}
              className="w-full py-2 px-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              View Cam
            </button>
          )}

          {/* DM Button */}
          {onStartDm && (
            <button
              onClick={async () => {
                setDmError('')
                try {
                  const res = await fetch('/api/dm/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetId: userId }),
                  })
                  const data = await res.json()
                  if (data.conversation) {
                    onStartDm(userId)
                    onClose()
                  } else {
                    setDmError(data.error || 'Cannot DM this user')
                  }
                } catch {
                  setDmError('Failed to start DM')
                }
              }}
              className="w-full py-2 px-3 border border-pink-300 text-pink-600 rounded-lg text-sm font-medium hover:bg-pink-50"
            >
              Send Message
            </button>
          )}
          {dmError && <p className="text-xs text-red-500 text-center">{dmError}</p>}
        </div>
      )}

      {isSelf && (
        <div className="p-4 text-center text-sm text-gray-400">
          {"That's you!"}
        </div>
      )}
    </div>
  )
}
