'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

interface JitsiVideoProps {
  roomName: string
  displayName: string
  isBroadcaster?: boolean
  onReady?: () => void
  onParticipantLeft?: () => void
}

export default function JitsiVideo({ roomName, displayName, isBroadcaster = false, onReady, onParticipantLeft }: JitsiVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (window.JitsiMeetExternalAPI) {
      setScriptLoaded(true)
      return
    }

    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'
    const script = document.createElement('script')
    script.src = `https://${domain}/external_api.js`
    script.async = true
    script.onload = () => setScriptLoaded(true)
    script.onerror = () => console.error('Failed to load Jitsi script')
    document.body.appendChild(script)

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !roomName || apiRef.current) return

    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'

    const options: any = {
      roomName: `GirlyPopChat-${roomName}`,
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      userInfo: {
        displayName: displayName,
      },
      configOverwrite: {
        startWithAudioMuted: !isBroadcaster,
        startWithVideoMuted: !isBroadcaster,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: '#1f1f1f',
      },
    }

    apiRef.current = new window.JitsiMeetExternalAPI(domain, options)

    apiRef.current.addEventListener('videoConferenceJoined', () => {
      console.log('Jitsi: Joined conference')
      onReady?.()
    })

    apiRef.current.addEventListener('videoConferenceLeft', () => {
      console.log('Jitsi: Left conference')
      onParticipantLeft?.()
    })

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }
    }
  }, [scriptLoaded, roomName, displayName, isBroadcaster, onReady, onParticipantLeft])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[200px] bg-gray-900 rounded-lg overflow-hidden"
    />
  )
}
