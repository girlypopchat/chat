'use client'
import { useState, useEffect } from 'react'
import { Users, MessageSquare, Hash, Ticket, Activity } from 'lucide-react'
import Link from 'next/link'

const navItems = [
  { href: '/admin/invites', label: 'Invite Codes', icon: Ticket, description: 'Generate and manage beta invites' },
  { href: 'https://console.girlypopchat.com/users', label: 'Users', icon: Users, description: 'View and manage users' },
  { href: 'https://console.girlypopchat.com/dashboard', label: 'Console', icon: Hash, description: 'Full admin console' },
  { href: 'https://console.girlypopchat.com/requests', label: 'Requests', icon: MessageSquare, description: 'Invite request queue' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalMessages: 0, totalRooms: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      const [usersRes, invitesRes, roomsRes, messagesRes] = await Promise.all([
        fetch('/api/admin/stats/users'),
        fetch('/api/admin/stats/invites'),
        fetch('/api/admin/stats/rooms'),
        fetch('/api/admin/stats/messages'),
      ])

      const users = await usersRes.json()
      const invites = await invitesRes.json()
      const rooms = await roomsRes.json()
      const messages = await messagesRes.json()

      setStats({
        totalUsers: users?.count || 0,
        activeUsers: users?.active || 0,
        totalMessages: messages?.count || 0,
        totalRooms: rooms?.count || 0,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of GirlyPopChat platform</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <Activity className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-pink-600" />
                <span className="text-3xl font-bold text-gray-900">{stats.totalUsers}</span>
              </div>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-emerald-600" />
                <span className="text-3xl font-bold text-gray-900">{stats.activeUsers}</span>
              </div>
              <p className="text-sm text-gray-600">Active Now</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <Hash className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-gray-900">{stats.totalRooms}</span>
              </div>
              <p className="text-sm text-gray-600">Total Rooms</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-gray-900">{stats.totalMessages}</span>
              </div>
              <p className="text-sm text-gray-600">Total Messages</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-pink-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.label}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
