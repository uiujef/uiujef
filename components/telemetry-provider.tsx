'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const telemetryStore = {
  notifyTyping: (formName: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('telemetry:typing', { detail: { formName } }))
    }
  }
}

export function TelemetryProvider() {
  const pathname = usePathname()
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (pathname?.startsWith('/blackberry')) return

    const channelId = `visitor-${Math.random().toString(36).substring(7)}`
    const channel = supabase.channel('public:telemetry', {
      config: { presence: { key: channelId } }
    })
    
    channelRef.current = channel

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          page: pathname,
          isTyping: false,
          formName: '',
          startedAt: Date.now()
        })
      }
    })

    const handleTyping = async (e: any) => {
      if (!channelRef.current) return
      const { formName } = e.detail

      await channelRef.current.track({
        page: pathname,
        isTyping: true,
        formName,
        startedAt: Date.now()
      })

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

      typingTimeoutRef.current = setTimeout(async () => {
        if (channelRef.current) {
          await channelRef.current.track({
            page: pathname,
            isTyping: false,
            formName: '',
            startedAt: Date.now()
          })
        }
      }, 3000)
    }

    window.addEventListener('telemetry:typing', handleTyping as EventListener)

    return () => {
      window.removeEventListener('telemetry:typing', handleTyping as EventListener)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      supabase.removeChannel(channel)
    }
  }, [pathname])

  return null
}
