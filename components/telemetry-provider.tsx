'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const telemetryStore = {
  startFocus: (formName: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('telemetry:focus', { detail: { formName } }))
    }
  },
  stopFocus: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('telemetry:blur'))
    }
  }
}

export function TelemetryProvider() {
  const pathname = usePathname()
  const channelRef = useRef<any>(null)
  const heartbeatIntervalRef = useRef<any>(null)
  const isFocusedRef = useRef(false)
  const currentFormRef = useRef('')

  // 1. Session Tracking (Dynamic Visitor Counter)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (pathname?.startsWith('/blackberry')) return

    const trackSession = async () => {
      const visitKey = 'jef_session_tracked_v1'
      if (!sessionStorage.getItem(visitKey)) {
        sessionStorage.setItem(visitKey, 'true')
        try {
          await supabase.from('site_visits').insert([{
            path: pathname,
            user_agent: navigator.userAgent
          }])
        } catch (err) {
          // Graceful fallback if table doesn't exist yet
          console.warn('Could not record site visit (requires site_visits table):', err)
        }
      }
    }
    trackSession()
  }, [pathname])

  // 2. Presence & Form Heartbeat
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (pathname?.startsWith('/blackberry')) return

    const channelId = `visitor-${Math.random().toString(36).substring(7)}`
    const channel = supabase.channel('site_telemetry', {
      config: { presence: { key: channelId } }
    })
    
    channelRef.current = channel

    channel.subscribe(async (status, err) => {
      if (err) {
        console.warn('Telemetry connection error (harmless fallback):', err)
        return
      }
      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({
            page: pathname,
            isTyping: isFocusedRef.current,
            formName: currentFormRef.current,
            startedAt: Date.now(),
            lastHeartbeat: Date.now()
          })
        } catch (trackErr) {
          console.warn('Telemetry track error:', trackErr)
        }
      }
    })

    const handleFocus = async (e: any) => {
      if (!channelRef.current) return
      const { formName } = e.detail
      isFocusedRef.current = true
      currentFormRef.current = formName

      // Initial track
      try {
        await channelRef.current.track({
          page: pathname,
          isTyping: true,
          formName,
          startedAt: Date.now(),
          lastHeartbeat: Date.now()
        })
      } catch (err) {}

      // Start Continuous Heartbeat every 3 seconds
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = setInterval(async () => {
        if (channelRef.current && isFocusedRef.current) {
          try {
            await channelRef.current.track({
              page: pathname,
              isTyping: true,
              formName: currentFormRef.current,
              startedAt: Date.now(),
              lastHeartbeat: Date.now()
            })
          } catch (err) {}
        }
      }, 3000)
    }

    const handleBlur = async () => {
      if (!channelRef.current) return
      isFocusedRef.current = false
      currentFormRef.current = ''

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }

      try {
        await channelRef.current.track({
          page: pathname,
          isTyping: false,
          formName: '',
          startedAt: Date.now(),
          lastHeartbeat: Date.now()
        })
      } catch (err) {}
    }

    window.addEventListener('telemetry:focus', handleFocus as EventListener)
    window.addEventListener('telemetry:blur', handleBlur as EventListener)

    return () => {
      window.removeEventListener('telemetry:focus', handleFocus as EventListener)
      window.removeEventListener('telemetry:blur', handleBlur as EventListener)
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
      supabase.removeChannel(channel)
    }
  }, [pathname])

  return null
}
