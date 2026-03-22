'use client'
import { useState, useEffect } from 'react'
import { Ticket, Plus, Mail, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react'

interface InviteCode {
  id: string
  code: string
  usedById: string | null
  maxUses: number
  useCount: number
  expiresAt: string | null
  createdAt: string
}

export default function AdminInvitesPage() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [stats, setStats] = useState({ total: 0, available: 0, used: 0 })
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ count: 10, maxUses: 1, expiresInDays: 30 })
  const [emailForm, setEmailForm] = useState({ email: '', message: '' })
  const [showGenerate, setShowGenerate] = useState(false)
  const [showEmail, setShowEmail] = useState(false)

  useEffect(() => {
    loadInvites()
  }, [])

  const loadInvites = async () => {
    try {
      const [codesRes, statsRes] = await Promise.all([
        fetch('/api/admin/invites'),
        fetch('/api/admin/invites/stats'),
      ])
      const codes = await codesRes.json()
      const stats = await statsRes.json()
      setInviteCodes(codes || [])
      setStats(stats || { total: 0, available: 0, used: 0 })
    } catch (error) {
      console.error('Failed to load invites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/invites/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        alert(`Generated ${data.codes.length} invite codes`)
        setShowGenerate(false)
        loadInvites()
      } else {
        alert(data.error || 'Failed to generate codes')
      }
    } catch (error) {
      alert('Failed to generate codes')
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/invites/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
      })
      const data = await res.json()
      if (data.success) {
        alert('Invite sent successfully!')
        setShowEmail(false)
        setEmailForm({ email: '', message: '' })
        loadInvites()
      } else {
        alert(data.error || 'Failed to send invite')
      }
    } catch (error) {
      alert('Failed to send invite')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invite code?')) return
    try {
      const res = await fetch(`/api/admin/invites/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadInvites()
      }
    } catch (error) {
      alert('Failed to delete code')
    }
  }

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code)
    alert('Code copied to clipboard!')
  }

  const getStatus = (code: InviteCode) => {
    if (code.usedById) return { label: 'Used', className: 'bg-gray-800 text-gray-400', icon: XCircle }
    if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
      return { label: 'Expired', className: 'bg-red-900/30 text-red-400', icon: XCircle }
    }
    return { label: 'Available', className: 'bg-emerald-900/30 text-emerald-400', icon: CheckCircle }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Ticket className="w-8 h-8" />
              Invite Codes Management
            </h1>
            <p className="text-gray-600 mt-1">Generate and manage beta invite codes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowEmail(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2"
            >
              <Mail className="w-4 h-4" /> Send Email Invite
            </button>
            <button
              onClick={() => setShowGenerate(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Generate Codes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-pink-200">
            <div className="text-3xl font-bold text-pink-600">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Codes</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-emerald-200">
            <div className="text-3xl font-bold text-emerald-600">{stats.available}</div>
            <div className="text-sm text-gray-600 mt-1">Available</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-600">{stats.used}</div>
            <div className="text-sm text-gray-600 mt-1">Used</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">Recent Invite Codes (last 50)</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Uses</th>
                <th className="px-6 py-3">Expires</th>
                <th className="px-6 py-3">Created At</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inviteCodes.map(code => {
                const status = getStatus(code)
                const Icon = status.icon
                return (
                  <tr key={code.id} className="border-b border-gray-100 hover:bg-pink-50/30 transition">
                    <td className="px-6 py-3 font-mono font-medium text-pink-600">{code.code}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${status.className}`}>
                        <Icon className="w-3 h-3" /> {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {code.useCount}/{code.maxUses}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {new Date(code.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(code.code)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-pink-600 transition"
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600 transition"
                          title="Delete code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {showGenerate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Generate Invite Codes
              </h2>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.count}
                    onChange={e => setFormData({ ...formData, count: parseInt(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses Per Code</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={e => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires In (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.expiresInDays}
                    onChange={e => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGenerate(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
                  >
                    Generate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEmail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" /> Send Email Invite
              </h2>
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={emailForm.email}
                    onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                  <textarea
                    rows={3}
                    value={emailForm.message}
                    onChange={e => setEmailForm({ ...emailForm, message: e.target.value })}
                    placeholder="I'd love for you to join GirlyPopChat!"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmail(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
