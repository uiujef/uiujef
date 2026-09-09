'use client'

import { useState, useEffect } from 'react'
import { Loader2, Search, Download, Star } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Event = {
  id: string
  title: string
}

type Application = {
  application_id: string
  name: string
  email: string
  student_id: string
  status: string
  transaction_id: string
  event_id: string
  created_at: string
}

export function PriorityListManager() {
  const [applications, setApplications] = useState<Application[]>([])
  const [eventsMap, setEventsMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string>('All')

  const loadData = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch Priority Events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title')
        .eq('is_priority', true)

      if (eventsError) throw eventsError
      if (!eventsData || eventsData.length === 0) {
        setApplications([])
        setEventsMap({})
        setIsLoading(false)
        return
      }

      const eMap: Record<string, string> = {}
      eventsData.forEach(e => { eMap[e.id] = e.title })
      setEventsMap(eMap)

      const eventIds = eventsData.map(e => e.id)

      // 2. Fetch Applications (no filter for archived!)
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false })

      if (appsError) throw appsError

      setApplications(appsData as Application[] || [])
    } catch (err: any) {
      toast.error('Database Error: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      (app.name && app.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.email && app.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.student_id && app.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.application_id && app.application_id.toLowerCase().includes(searchQuery.toLowerCase()))
      
    const matchesEvent = selectedEventId === 'All' || app.event_id === selectedEventId

    return matchesSearch && matchesEvent
  })

  // Group by Event for UI display
  const groupedApps = filteredApps.reduce((acc, app) => {
    const eventName = eventsMap[app.event_id] || 'Unknown Event'
    if (!acc[eventName]) acc[eventName] = []
    acc[eventName].push(app)
    return acc
  }, {} as Record<string, Application[]>)

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-white rounded-[2rem] border border-slate-200 shadow-sm">
        <Loader2 className="size-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-50 p-6 rounded-[2rem] border border-purple-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Star className="size-6 text-purple-500 fill-purple-100" />
            Priority List
          </h2>
          <p className="text-sm text-slate-600 mt-1">Permanent record of applications for highly important events.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name, Email, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all bg-white shadow-sm"
          />
        </div>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="rounded-xl border border-slate-200 py-3 px-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white shadow-sm"
        >
          <option value="All">All Priority Events</option>
          {Object.entries(eventsMap).map(([id, title]) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      {Object.keys(groupedApps).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="size-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4 border border-purple-100">
            <Star className="size-8 text-purple-300" />
          </div>
          <p className="text-slate-500 font-medium text-lg">No priority applications found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedApps).map(([eventName, apps]) => (
            <div key={eventName} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Star className="size-4 text-purple-500" />
                  {eventName}
                </h3>
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 shadow-sm">
                  {apps.length} Applications
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-white border-b border-slate-100 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-bold">App ID</th>
                      <th className="px-6 py-4 font-bold">Applicant</th>
                      <th className="px-6 py-4 font-bold">Contact</th>
                      <th className="px-6 py-4 font-bold">TrxID</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {apps.map((app) => (
                      <tr key={app.application_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-medium text-slate-500">
                          {app.application_id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{app.name}</div>
                          <div className="text-xs text-slate-500">{app.student_id || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-600">{app.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {app.transaction_id || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            app.status === 'Approved' ? "bg-green-100 text-green-700" :
                            app.status === 'Pending' ? "bg-orange-100 text-orange-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
