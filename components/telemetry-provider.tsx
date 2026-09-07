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

// Fallback UUID generator if crypto is unavailable
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function TelemetryProvider() {
  const pathname = usePathname()
  const channelRef = useRef<any>(null)
  const heartbeatIntervalRef = useRef<any>(null)
  const isFocusedRef = useRef(false)
  const currentFormRef = useRef('')
  const sessionIdRef = useRef<string>('')

  // 1. Session Tracking (Dynamic Visitor Counter - Zero-Based)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (pathname?.startsWith('/blackberry')) return

    const trackSession = async () => {
      let sessionId = sessionStorage.getItem('jef_session_id')
      if (!sessionId) {
        sessionId = generateId()
        sessionStorage.setItem('jef_session_id', sessionId)
        try {
          // Atomically insert unique visitor session
          await supabase.from('site_visitors').insert([{
            session_id: sessionId,
            path: pathname,
            created_at: new Date().toISOString()
          }])
        } catch (err) {
          console.warn('Could not record site visit. Ensure site_visitors table exists.', err)
        }
      }
      sessionIdRef.current = sessionId
    }
    trackSession()
  }, [pathname])

  // 2. Presence & Bulletproof Database Form Heartbeat
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (pathname?.startsWith('/blackberry')) return

    // Keep lightweight Presence for "Active Visitors Right Now" (Site-wide)
    const channelId = `visitor-${sessionIdRef.current || generateId()}`
    const channel = supabase.channel('site_telemetry', {
      config: { presence: { key: channelId } }
    })
    
    channelRef.current = channel

    channel.subscribe(async (status, err) => {
      if (err) return
      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({
            page: pathname,
            startedAt: Date.now()
          })
        } catch (trackErr) {}
      }
    })

    const upsertFormHeartbeat = async () => {
      if (!isFocusedRef.current || !currentFormRef.current || !sessionIdRef.current) return
      try {
        await supabase.from('form_activity').upsert({
          id: sessionIdRef.current,
          form_type: currentFormRef.current,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
      } catch (err) {
        // Fallback or ignore if table isn't created yet
      }
    }

    const handleFocus = async (e: any) => {
      const { formName } = e.detail
      isFocusedRef.current = true
      currentFormRef.current = formName

      // Immediate heartbeat ping
      upsertFormHeartbeat()

      // Continuous strict ping every 2.5 seconds
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = setInterval(upsertFormHeartbeat, 2500)
    }

    const handleBlur = async () => {
      isFocusedRef.current = false
      currentFormRef.current = ''

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }

      // Proactively delete/disable the session from heartbeat immediately
      if (sessionIdRef.current) {
        try {
          await supabase.from('form_activity')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', sessionIdRef.current)
        } catch (err) {}
      }
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
