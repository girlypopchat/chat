'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import type { Socket } from 'socket.io-client'

interface Conversation {
  id: string
  otherUser: { id: string; username: string; displayName?: string; avatar?: string; genderIcon?: string }
  lastMessage: { content: string; createdAt: string; senderId: string } | null
  unreadCount: number
}

interface DmMessage {
  id: string
  conversationId: string
  sender: { id: string; username: string; displayName?: string; avatar?: string }
  content: string
  imageUrl?: string
  createdAt: string
}

interface DmPanelProps {
  currentUserId: string
  socket: Socket | null
  onNewDm?: (targetId: string) => void
}

export default function DmPanel({ currentUserId, socket, onNewDm }: DmPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<DmMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch conversations
  useEffect(() => {
    fetch('/api/dm/conversations')
      .then(r => r.json())
      .then(d => setConversations(d.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Listen for incoming DMs
  useEffect(() => {
    if (!socket) return

    const handleMessage = (msg: DmMessage) => {
      if (activeConv && msg.conversationId === activeConv.id) {
        setMessages(prev => [...prev, msg])
        socket.emit('dm:read', { conversationId: activeConv.id })
      }
      // Update conversation list
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversationId)
        if (idx === -1) return prev
        const updated = [...prev]
        updated[idx] = {
          ...updated[idx],
          lastMessage: { content: msg.content, createdAt: msg.createdAt, senderId: msg.sender.id },
          unreadCount: (activeConv?.id === msg.conversationId) ? 0 : updated[idx].unreadCount + (msg.sender.id !== currentUserId ? 1 : 0),
        }
        updated.sort((a, b) => {
          const aTime = a.lastMessage?.createdAt || ''
          const bTime = b.lastMessage?.createdAt || ''
          return bTime.localeCompare(aTime)
        })
        return updated
      })
    }

    const handleTyping = (data: { conversationId: string; username: string; isTyping: boolean }) => {
      if (activeConv && data.conversationId === activeConv.id) {
        setTypingUser(data.isTyping ? data.username : null)
      }
    }

    const handleRead = (data: { conversationId: string }) => {
      // Could show read receipts here
    }

    socket.on('dm:message', handleMessage)
    socket.on('dm:typing', handleTyping)
    socket.on('dm:read', handleRead)

    return () => {
      socket.off('dm:message', handleMessage)
      socket.off('dm:typing', handleTyping)
      socket.off('dm:read', handleRead)
    }
  }, [socket, activeConv, currentUserId])

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages])

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv)
    setMessages([])
    setTypingUser(null)

    const res = await fetch(`/api/dm/messages?conversationId=${conv.id}`)
    const data = await res.json()
    setMessages(data.messages || [])

    // Mark as read
    socket?.emit('dm:read', { conversationId: conv.id })
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c))
  }

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !activeConv || !socket) return

    setSending(true)
    socket.emit('dm:send', {
      conversationId: activeConv.id,
      content: input.trim(),
    }, (res: any) => {
      setSending(false)
      if (res.success) setInput('')
    })
  }

  const handleTyping = () => {
    if (!socket || !activeConv) return
    socket.emit('dm:typing', { conversationId: activeConv.id, isTyping: true })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('dm:typing', { conversationId: activeConv.id, isTyping: false })
    }, 2000)
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  // Active conversation view
  if (activeConv) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b flex items-center gap-2">
          <button onClick={() => setActiveConv(null)} className="p-1 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs shrink-0">
            {(activeConv.otherUser.displayName || activeConv.otherUser.username)[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{activeConv.otherUser.displayName || activeConv.otherUser.username}</div>
            <div className="text-xs text-gray-400">@{activeConv.otherUser.username}</div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={'flex gap-2 ' + (msg.sender.id === currentUserId ? 'flex-row-reverse' : '')}>
              <div className={'max-w-[75%] px-3 py-2 rounded-2xl text-sm ' +
                (msg.sender.id === currentUserId
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm')}>
                {msg.content}
                {msg.imageUrl && <img src={msg.imageUrl} alt="" className="mt-1 max-w-full rounded-lg" />}
              </div>
            </div>
          ))}
          {typingUser && (
            <div className="text-xs text-gray-400 italic">{typingUser} is typing...</div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-2 border-t flex gap-2">
          <input
            value={input}
            onChange={e => { setInput(e.target.value); handleTyping() }}
            placeholder="Message..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    )
  }

  // Conversation list view
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="text-sm font-medium">
          Messages
          {totalUnread > 0 && (
            <span className="ml-2 bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full">{totalUnread}</span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center p-8 text-gray-400 text-sm">
            No conversations yet.<br />
            <span className="text-xs">Click a user to start a DM.</span>
          </div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => openConversation(conv)}
              className="w-full p-3 hover:bg-gray-50 flex items-center gap-3 text-left border-b border-gray-50"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm shrink-0">
                {(conv.otherUser.displayName || conv.otherUser.username)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{conv.otherUser.displayName || conv.otherUser.username}</span>
                  {conv.lastMessage && (
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate">
                    {conv.lastMessage
                      ? (conv.lastMessage.senderId === currentUserId ? 'You: ' : '') + conv.lastMessage.content
                      : 'No messages yet'}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
