import { RtcTokenBuilder, RtcRole } from 'agora-access-token'
import { nanoid } from 'nanoid'

const APP_ID = process.env.AGORA_APP_ID || ''
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || ''

export function generateBroadcastRoomName(username: string): string {
  const suffix = nanoid(6)
  return `${username.toLowerCase()}-${suffix}`
}

export function generateAgoraToken(channelName: string, uid: string, isBroadcaster: boolean = false): string {
  if (!APP_ID || !APP_CERTIFICATE) {
    console.warn('Agora credentials not configured - returning dummy token')
    return 'dummy-token-for-development'
  }

  const role = isBroadcaster ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER
  const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 3600 // 1 hour
  
  const uidNum = parseInt(uid.replace(/\D/g, '').slice(0, 8)) || 0
  
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uidNum,
    role,
    privilegeExpiredTs
  )
  
  return token
}

export interface ViewRequest {
  viewerId: string
  viewerName: string
  viewerAvatar?: string
  requestedAt: number
}

export interface ViewApproval {
  approved: boolean
  roomName?: string
  agoraToken?: string
  uid?: number
}

const pendingViewRequests = new Map<string, ViewRequest[]>()

export function addViewRequest(broadcasterId: string, request: ViewRequest) {
  const existing = pendingViewRequests.get(broadcasterId) || []
  existing.push(request)
  pendingViewRequests.set(broadcasterId, existing)
}

export function getViewRequests(broadcasterId: string): ViewRequest[] {
  return pendingViewRequests.get(broadcasterId) || []
}

export function removeViewRequest(broadcasterId: string, viewerId: string) {
  const existing = pendingViewRequests.get(broadcasterId) || []
  const filtered = existing.filter(r => r.viewerId !== viewerId)
  pendingViewRequests.set(broadcasterId, filtered)
}

export function clearViewRequests(broadcasterId: string) {
  pendingViewRequests.delete(broadcasterId)
}
