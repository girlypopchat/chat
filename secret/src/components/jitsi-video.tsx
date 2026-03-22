'use client'

import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'
    
    if (!containerRef.current || !roomName) return

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
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat',
          'settings', 'raisehand', 'videoquality', 'filmstrip',
          'shortcuts', 'tileview', 'select-background', 'help', 'mute-everyone'
        ],
      },
    }

    if (window.JitsiMeetExternalAPI) {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options)

      apiRef.current.addEventListener('videoConferenceJoined', () => {
        console.log('Jitsi: Joined conference')
        onReady?.()
      })

      apiRef.current.addEventListener('videoConferenceLeft', () => {
        console.log('Jitsi: Left conference')
        onParticipantLeft?.()
      })

      apiRef.current.addEventListener('participantLeft', () => {
        console.log('Jitsi: Participant left')
      })
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }
    }
  }, [roomName, displayName, isBroadcaster, onReady, onParticipantLeft])

  useEffect(() => {
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) return Promise.resolve()
      
      return new Promise<void>((resolve) => {
        const script = document.createElement('script')
        const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'
        script.src = `https://${domain}/external_api.js`
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => {
          console.error('Failed to load Jitsi script')
          resolve()
        }
        document.body.appendChild(script)
      })
    }

    loadJitsiScript()
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[200px] bg-gray-900 rounded-lg overflow-hidden"
    />
  )
}
