'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Activity, Users, MousePointerClick, BarChart3, Clock, Loader2, Sparkles } from 'lucide-react'

export function TelemetryOverview({ stats }: { stats: any }) {
  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const [activeApplicants, setActiveApplicants] = useState<any[]>([])
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [trueVisitorCount, setTrueVisitorCount] = useState<number>(0)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: apps } = await supabase.from('applications').select('created_at').neq('status', 'archived')
        
        const days = Array.from({ length: 14 }).map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (13 - i))
          return d.toISOString().split('T')[0]
        })

        const grouped = days.map(dayStr => {
          const dayDate = new Date(dayStr)
          const shortDate = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const count = apps?.filter(a => (a.created_at || '').startsWith(dayStr)).length || 0
          return { name: shortDate, submissions: count }
        })

        setHistoricalData(grouped)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoadingHistory(false)
      }
    }
    
    // Initial True Visitor Count Fetch
    const fetchVisitors = async () => {
      try {
        const { count, error } = await supabase.from('site_visitors').select('*', { count: 'exact', head: true })
        if (!error && count !== null) {
          setTrueVisitorCount(count) // Zero-based true dynamic hits!
        }
      } catch (err) {
        // Table might not exist yet
      }
    }

    fetchHistory()
    fetchVisitors()
  }, [])

  // Live Subscription for Site Visitors to auto-increment without refresh
  useEffect(() => {
    if (typeof window === 'undefined') return
    const channel = supabase.channel('realtime_visitors')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'site_visitors' },
        () => {
          setTrueVisitorCount(prev => prev + 1)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Live Active Forms Heartbeat Polling
  useEffect(() => {
    let interval: any
    const pollFormActivity = async () => {
      try {
        const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
        const { data, error } = await supabase
          .from('form_activity')
          .select('form_type')
          .eq('is_active', true)
          .gte('updated_at', fiveSecondsAgo)

        if (!error && data) {
          setActiveApplicants(data.map(d => ({ formName: d.form_type })))
        } else {
          setActiveApplicants([])
        }
      } catch (err) {
        // Table might not exist yet
      }
    }

    pollFormActivity()
    interval = setInterval(pollFormActivity, 2500)
    return () => clearInterval(interval)
  }, [])

  // Site-Wide Presence Channel
  useEffect(() => {
    if (typeof window === 'undefined') return

    const channel = supabase.channel('site_telemetry')
    
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const users: any[] = []
      
      Object.keys(state).forEach(key => {
        state[key].forEach((presence: any) => {
          users.push(presence)
        })
      })
      
      setActiveUsers(users)
    })

    channel.subscribe((status, err) => {
      if (err) console.warn('Admin telemetry connection error:', err)
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const maxSubmissions = Math.max(...historicalData.map(d => d.submissions), 1)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute -right-4 -top-4 size-20 bg-emerald-50 rounded-full blur-2xl" />
          <div className="relative z-10 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Active Visitors Right Now</p>
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <Activity className="size-5 text-emerald-600 relative z-10" />
                  {activeUsers.length > 0 && (
                    <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-900 tracking-tight">{activeUsers.length}</p>
              <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                </span>
                Live
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute -right-4 -top-4 size-20 bg-blue-50 rounded-full blur-2xl" />
          <div className="relative z-10 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Total Visitors (All Time)</p>
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="size-5 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-4xl font-black text-slate-900 tracking-tight">{trueVisitorCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md sm:col-span-2">
          <div className="absolute -right-4 -top-4 size-32 bg-[#F26522]/5 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <MousePointerClick className="size-4" />
                Live Form Activity
              </p>
              <div className="size-10 rounded-full bg-[#F26522]/10 flex items-center justify-center">
                <Sparkles className="size-5 text-[#F26522]" />
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              {activeApplicants.length > 0 ? (
                <div className="flex items-center gap-4">
                  <p className="text-4xl font-black text-[#F26522] tracking-tight">{activeApplicants.length}</p>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-slate-800">Applicants Currently Typing</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {Array.from(new Set(activeApplicants.map(a => a.formName))).map(form => (
                        <span key={form} className="px-2 py-0.5 rounded border border-[#F26522]/20 bg-[#F26522]/10 text-[#F26522] text-[10px] font-semibold uppercase tracking-wider">
                          {form as string}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-400 mt-2">
                  <Clock className="size-5" />
                  <p className="text-sm font-medium">No one is currently filling out forms.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="size-5 text-[#F26522]" />
              Application Trends
            </h3>
            <p className="text-sm text-slate-500 mt-1">Daily submission activity over the last 14 days.</p>
          </div>
        </div>

        <div className="h-[250px] w-full flex items-end gap-2 sm:gap-4 justify-between relative">
          {isLoadingHistory ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="size-8 animate-spin mb-4 text-[#F26522]" />
              <p className="text-sm font-medium">Loading historical data...</p>
            </div>
          ) : historicalData.reduce((acc, curr) => acc + curr.submissions, 0) === 0 ? (
             <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-xl">
               Not enough data to display chart.
             </div>
          ) : (
            <>
              {historicalData.map((data, index) => {
                const heightPercentage = Math.max((data.submissions / maxSubmissions) * 100, 4);
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <div className="w-full relative flex justify-center group-hover:-translate-y-1 transition-transform">
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-deep text-white text-xs font-bold py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                        {data.submissions} Apps
                      </div>
                      <div 
                        className="w-full max-w-[40px] bg-gradient-to-t from-[#1B2A4A] to-[#2a4070] rounded-t-md opacity-80 group-hover:opacity-100 transition-opacity group-hover:from-[#F26522] group-hover:to-[#ff8a50]" 
                        style={{ height: `${heightPercentage}%`, minHeight: '10px' }}
                      />
                    </div>
                    <div className="mt-4 text-[10px] sm:text-xs font-medium text-slate-400 truncate max-w-full text-center">
                      {data.name}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
