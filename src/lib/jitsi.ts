import { nanoid } from 'nanoid'

export function generateBroadcastRoomName(username: string): string {
  const suffix = nanoid(6)
  return `${username.toLowerCase()}-${suffix}`
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
