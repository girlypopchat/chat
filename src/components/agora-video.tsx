'use client'

import { useEffect, useRef, useState } from 'react'
import AgoraRTC from 'agora-rtc-sdk-ng'

interface AgoraVideoProps {
  channelName: string
  uid: string
  token: string
  isBroadcaster?: boolean
  onUserJoined?: (uid: string) => void
  onUserLeft?: (uid: string) => void
  onReady?: () => void
}

export default function AgoraVideo({ 
  channelName, 
  uid, 
  token, 
  isBroadcaster = false,
  onUserJoined,
  onUserLeft,
  onReady 
}: AgoraVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const [localTracks, setLocalTracks] = useState<any[]>([])
  const [remoteVideos, setRemoteVideos] = useState<Map<string, HTMLVideoElement>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!channelName || !uid || !token || token === 'dummy-token-for-development') {
      setError('Agora not configured - please add AGORA_APP_ID and AGORA_APP_CERTIFICATE to .env')
      return
    }

    const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''
    
    if (!APP_ID) {
      setError('Agora App ID not configured')
      return
    }

    const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
    clientRef.current = client

    const initClient = async () => {
      try {
        await client.setClientRole(isBroadcaster ? 'host' : 'audience')
        
        const uidNum = parseInt(uid.replace(/\D/g, '').slice(0, 8)) || 0
        await client.join(APP_ID, channelName, token, uidNum)

        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType)
          if (mediaType === 'video') {
            const remoteVideo = document.createElement('video')
            remoteVideo.autoplay = true
            remoteVideo.playsInline = true
            user.videoTrack?.play(remoteVideo)
            setRemoteVideos(prev => new Map(prev).set(user.uid.toString(), remoteVideo))
            onUserJoined?.(user.uid.toString())
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play()
          }
        })

        client.on('user-unpublished', (user) => {
          setRemoteVideos(prev => {
            const next = new Map(prev)
            const el = next.get(user.uid.toString())
            if (el) el.srcObject = null
            next.delete(user.uid.toString())
            return next
          })
          onUserLeft?.(user.uid.toString())
        })

        client.on('user-joined', (user) => {
          onUserJoined?.(user.uid.toString())
        })

        client.on('user-left', (user) => {
          onUserLeft?.(user.uid.toString())
        })

        if (isBroadcaster) {
          const tracks = await AgoraRTC.createMicrophoneAndCameraTracks()
          const videoTrack = tracks[1]
          
          await client.publish(tracks)
          
          const video = document.createElement('video')
          video.autoplay = true
          video.playsInline = true
          video.muted = true
          videoTrack.play(video)
          setLocalTracks(tracks)
          localVideoRef.current = video
        }

        setIsConnected(true)
        onReady?.()
      } catch (err: any) {
        console.error('Agora connection error:', err)
        setError(`Connection failed: ${err?.message || err}`)
      }
    }

    initClient()

    return () => {
      clientRef.current?.leave()
      localTracks.forEach((track: any) => track.stop?.())
    }
  }, [channelName, uid, token, isBroadcaster])

  if (error) {
    return (
      <div className="w-full h-full min-h-[200px] bg-gray-900 rounded-lg flex items-center justify-center text-red-400 text-sm p-4">
        {error}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[200px] bg-gray-900 rounded-lg overflow-hidden relative">
      <div ref={videoContainerRef} className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
        {localVideoRef.current && isBroadcaster && (
          <div className="relative rounded overflow-hidden">
            <video 
              ref={(el) => { if (el) localVideoRef.current = el }}
              autoPlay 
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-2 py-0.5 rounded">You</span>
          </div>
        )}
        {Array.from(remoteVideos.entries()).map(([remoteUid, videoEl]) => (
          <div key={remoteUid} className="relative rounded overflow-hidden">
            <video 
              autoPlay 
              playsInline
              ref={(el) => { if (el) {
                const current = remoteVideos.get(remoteUid)
                if (!current) {
                  setRemoteVideos(prev => new Map(prev).set(remoteUid, el))
                }
              }}}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-2 py-0.5 rounded">
              User {remoteUid.slice(0, 4)}
            </span>
          </div>
        ))}
      </div>
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-white">Connecting to video...</div>
        </div>
      )}
    </div>
  )
}
