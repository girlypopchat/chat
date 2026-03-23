'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, Users, Hash, Lock, Clock, Check, X, ChevronRight,
  Sparkles
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface Room {
  id: string
  name: string
  displayName: string
  description?: string
  icon?: string
  memberCount: number
  isNSFW: boolean
}

interface RoomProposal {
  id: string
  name: string
  displayName: string
  description?: string
  icon?: string
  sponsorCount: number
  status: string
  expiresAt?: string
  createdAt: string
  createdBy: {
    username: string
    displayName?: string
    avatar?: string
  }
  sponsors: Array<{
    userId: string
    user: {
      username: string
      displayName?: string
      avatar?: string
    }
  }>
}

interface RoomsSidebarProps {
  currentRoomId: string | null
  onJoinRoom: (roomId: string) => void
  userId: string
}

const REQUIRED_SPONSORS = 5

// ============================================
// Component
// ============================================

export function RoomsSidebar({ currentRoomId, onJoinRoom, userId }: RoomsSidebarProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [proposals, setProposals] = useState<RoomProposal[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'rooms' | 'proposals'>('rooms')
  const [loading, setLoading] = useState(false)

  // Form state
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDisplayName, setNewRoomDisplayName] = useState('')
  const [newRoomDescription, setNewRoomDescription] = useState('')
  const [newRoomIcon, setNewRoomIcon] = useState('💬')

  // Fetch rooms and proposals
  useEffect(() => {
    fetchRooms()
    fetchProposals()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchProposals()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms')
      const data = await res.json()
      setRooms(data.rooms || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    }
  }

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/rooms/proposals')
      const data = await res.json()
      setProposals(data.proposals || [])
    } catch (error) {
      console.error('Failed to fetch proposals:', error)
    }
  }

  const createProposal = async () => {
    if (!newRoomName.trim() || !newRoomDisplayName.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/rooms/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          displayName: newRoomDisplayName,
          description: newRoomDescription,
          icon: newRoomIcon,
          userId,
        }),
      })

      const data = await res.json()
      
      if (data.proposal) {
        setProposals(prev => [data.proposal, ...prev])
        setShowCreateModal(false)
        setNewRoomName('')
        setNewRoomDisplayName('')
        setNewRoomDescription('')
        setNewRoomIcon('💬')
      }
    } catch (error) {
      console.error('Failed to create proposal:', error)
    } finally {
      setLoading(false)
    }
  }

  const sponsorProposal = async (proposalId: string) => {
    try {
      const res = await fetch(`/api/rooms/proposals/${proposalId}/sponsor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await res.json()

      if (data.room) {
        // Room was created! Refresh rooms
        fetchRooms()
        fetchProposals()
      } else if (data.success) {
        // Update sponsor count
        setProposals(prev => prev.map(p => 
          p.id === proposalId 
            ? { ...p, sponsorCount: data.sponsorCount }
            : p
        ))
      }
    } catch (error) {
      console.error('Failed to sponsor proposal:', error)
    }
  }

  const hasSponsored = (proposal: RoomProposal) => {
    return proposal.sponsors.some(s => s.userId === userId)
  }

  const timeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    return `${hours}h remaining`
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm text-gray-700">Rooms</span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1 text-gray-400 hover:text-pink-500 hover:bg-pink-50 rounded transition-colors"
            title="Create Room"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-1.5 text-xs font-medium rounded ${
              activeTab === 'rooms'
                ? 'bg-pink-100 text-pink-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`flex-1 py-1.5 text-xs font-medium rounded relative ${
              activeTab === 'proposals'
                ? 'bg-pink-100 text-pink-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Proposals ({proposals.length})
            {proposals.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'rooms' ? (
          <div className="p-2 space-y-1">
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => onJoinRoom(room.id)}
                className={`w-full p-2 rounded-lg text-left transition-colors ${
                  currentRoomId === room.id
                    ? 'bg-pink-100 border border-pink-200'
                    : 'hover:bg-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{room.icon || '💬'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{room.displayName}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {room.memberCount}
                      {room.isNSFW && <span className="text-orange-500">🔞</span>}
                    </div>
                  </div>
                  {currentRoomId === room.id && (
                    <ChevronRight className="w-4 h-4 text-pink-500" />
                  )}
                </div>
              </button>
            ))}
            
            {rooms.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No rooms yet
                <p className="text-xs mt-1">Create a proposal to start one!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {proposals.map(proposal => (
              <div
                key={proposal.id}
                className="bg-white rounded-lg border p-3 space-y-2"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{proposal.icon || '💬'}</span>
                    <div>
                      <div className="font-medium text-sm">{proposal.displayName}</div>
                      <div className="text-xs text-gray-400">@{proposal.name}</div>
                    </div>
                  </div>
                  {proposal.expiresAt && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeRemaining(proposal.expiresAt)}
                    </span>
                  )}
                </div>

                {/* Description */}
                {proposal.description && (
                  <p className="text-xs text-gray-500">{proposal.description}</p>
                )}

                {/* Sponsors */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {proposal.sponsors.slice(0, 5).map((s, i) => (
                      <div
                        key={s.userId}
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs border-2 border-white"
                        title={s.user.displayName || s.user.username}
                      >
                        {(s.user.displayName || s.user.username)[0].toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs">
                    <span className="font-medium text-pink-600">{proposal.sponsorCount}</span>
                    <span className="text-gray-400">/{REQUIRED_SPONSORS}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-bg transition-all duration-500"
                    style={{ width: `${(proposal.sponsorCount / REQUIRED_SPONSORS) * 100}%` }}
                  />
                </div>

                {/* Sponsor button */}
                {hasSponsored(proposal) ? (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Check className="w-3 h-3" />
                    You sponsored this
                  </div>
                ) : (
                  <button
                    onClick={() => sponsorProposal(proposal.id)}
                    className="w-full py-1.5 text-xs font-medium gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Sponsor ({REQUIRED_SPONSORS - proposal.sponsorCount} more needed)
                  </button>
                )}
              </div>
            ))}

            {proposals.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No pending proposals
                <p className="text-xs mt-1">Be the first to propose a room!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Propose a Room</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-pink-50 rounded-lg p-3 text-sm text-pink-700">
              <strong>How it works:</strong> You need {REQUIRED_SPONSORS} people to sponsor your room proposal before it becomes real. Share it with friends!
            </div>

            <div className="space-y-3">
              {/* Icon picker */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {['💬', '🎮', '🎵', '📸', '💼', '🎨', '📚', '🍿', '🌍', '❤️', '🔥', '✨'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNewRoomIcon(emoji)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                        newRoomIcon === emoji 
                          ? 'bg-pink-100 border-2 border-pink-400' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room name */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Room URL Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="my-cool-room"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Lowercase, numbers, hyphens only</p>
              </div>

              {/* Display name */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Display Name</label>
                <input
                  type="text"
                  value={newRoomDisplayName}
                  onChange={e => setNewRoomDisplayName(e.target.value)}
                  placeholder="My Cool Room"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Description (optional)</label>
                <input
                  type="text"
                  value={newRoomDescription}
                  onChange={e => setNewRoomDescription(e.target.value)}
                  placeholder="A place to talk about..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={createProposal}
              disabled={!newRoomName.trim() || !newRoomDisplayName.trim() || loading}
              className="w-full py-2.5 gradient-bg text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? 'Creating...' : 'Create Proposal'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
