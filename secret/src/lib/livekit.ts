// LiveKit Video Integration
import { AccessToken, VideoGrant } from 'livekit-server-sdk'

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!
const LIVEKIT_URL = process.env.LIVEKIT_URL!

// ============================================
// Token Generation
// ============================================

interface TokenOptions {
  roomName: string
  participantName: string
  participantIdentity: string
  isPublisher: boolean
  isSubscriber: boolean
  canPublishData?: boolean
}

export async function generateLiveKitToken(options: TokenOptions): Promise<string> {
  const {
    roomName,
    participantName,
    participantIdentity,
    isPublisher,
    isSubscriber,
    canPublishData = false,
  } = options
  
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    ttl: '1h',
  })
  
  const grants: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: isPublisher,
    canSubscribe: isSubscriber,
    canPublishData: canPublishData && isPublisher,
    roomRecord: false,
  }
  
  token.addGrant(grants)
  
  return await token.toJwt()
}

// ============================================
// Broadcaster Token (Camera/Screen)
// ============================================

export async function generateBroadcasterToken(
  roomName: string,
  userId: string,
  username: string
): Promise<string> {
  return generateLiveKitToken({
    roomName,
    participantName: username,
    participantIdentity: `broadcaster-${userId}`,
    isPublisher: true,
    isSubscriber: true, // Can see viewers in room
    canPublishData: true,
  })
}

// ============================================
// Viewer Token
// ============================================

export async function generateViewerToken(
  roomName: string,
  userId: string,
  username: string
): Promise<string> {
  return generateLiveKitToken({
    roomName,
    participantName: username,
    participantIdentity: `viewer-${userId}`,
    isPublisher: false,
    isSubscriber: true,
  })
}

export async function generateTwoWayToken(
  roomName: string,
  userId: string,
  username: string
): Promise<string> {
  return generateLiveKitToken({
    roomName,
    participantName: username,
    participantIdentity: `participant-${userId}`,
    isPublisher: true,
    isSubscriber: true,
    canPublishData: true,
  })
}

// ============================================
// Room Name Generation
// ============================================

import { nanoid } from 'nanoid'

export function generateBroadcastRoomName(username: string): string {
  const suffix = nanoid(6)
  return `${username.toLowerCase()}-${suffix}`
}

// ============================================
// View Request Flow
// ============================================

export interface ViewRequest {
  viewerId: string
  viewerName: string
  viewerAvatar?: string
  requestedAt: number
}

export interface ViewApproval {
  approved: boolean
  token?: string
  roomName?: string
}

// In-memory store for view requests (use Redis in production)
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
