'use client'

import { useState, useEffect } from 'react'
import { Loader2, Search, Download, Star, Eye, X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ConfirmModal } from '@/components/ui/confirm-modal'

type Event = {
  id: string
  title: string
}

type Application = {
  application_id: string
  name: string
  email: string
  phone: string
  student_id: string
  status: string
  transaction_id: string
  event_id: string
  created_at: string
  team_name: string
  team_members: any[]
  custom_responses: any
}

export function PriorityListManager() {
  const [applications, setApplications] = useState<Application[]>([])
  const [eventsMap, setEventsMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string>('All')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [eventToRemove, setEventToRemove] = useState<string | null>(null)

  const handleRemoveEvent = async () => {
    if (!eventToRemove) return;
    try {
      const { error } = await supabase.from('events').update({ is_priority: false }).eq('id', eventToRemove);
      if (error) throw error;
      toast.success("Event removed from priority list.");
      loadData(); // Refresh the list
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsConfirmOpen(false);
      setEventToRemove(null);
    }
  }

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
  }, Object.keys(eventsMap).reduce((acc, id) => {
    if (selectedEventId === 'All' || id === selectedEventId) {
      acc[eventsMap[id]] = [];
    }
    return acc;
  }, {} as Record<string, Application[]>))

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
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 shadow-sm">
                    {apps.length} Applications
                  </span>
                  <button
                    onClick={() => {
                      const eventId = apps[0]?.event_id || Object.keys(eventsMap).find(key => eventsMap[key] === eventName);
                      if (eventId) {
                        setEventToRemove(eventId);
                        setIsConfirmOpen(true);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove from Priority List"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
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
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {apps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium text-sm">
                          No applications found for this priority event.
                        </td>
                      </tr>
                    ) : apps.map((app) => (
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
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="p-1.5 bg-white border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 hover:text-slate-800 transition-colors"
                          >
                            <Eye className="size-4" />
                          </button>
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

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Application Details
              </h3>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">App ID</div>
                  <div className="font-mono font-medium text-slate-800">{selectedApp.application_id}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</div>
                  <div className={cn(
                    "font-bold",
                    selectedApp.status === 'Approved' ? "text-green-600" :
                    selectedApp.status === 'Pending' ? "text-orange-500" : "text-red-600"
                  )}>{selectedApp.status}</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Applicant Info</h4>
                  <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-sm text-slate-500">Name</span>
                      <span className="text-sm font-bold text-slate-800">{selectedApp.name}</span>
                    </div>
                    {selectedApp.email && (
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm text-slate-500">Email</span>
                        <span className="text-sm font-bold text-slate-800">{selectedApp.email}</span>
                      </div>
                    )}
                    {selectedApp.phone && (
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm text-slate-500">Phone</span>
                        <span className="text-sm font-bold text-slate-800">{selectedApp.phone}</span>
                      </div>
                    )}
                    {selectedApp.student_id && (
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm text-slate-500">Student ID</span>
                        <span className="text-sm font-bold text-slate-800">{selectedApp.student_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedApp.team_name && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Team Info</h4>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm text-slate-500">Team Name</span>
                        <span className="text-sm font-bold text-slate-800">{selectedApp.team_name}</span>
                      </div>
                      {selectedApp.team_members && selectedApp.team_members.length > 0 && (
                        <div className="p-4 bg-slate-50">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Members ({selectedApp.team_members.length})</h5>
                          <div className="space-y-3">
                            {selectedApp.team_members.map((member: any, idx: number) => (
                              <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200">
                                <div className="font-bold text-slate-800 text-sm mb-1">{member.name} {idx === 0 && '(Leader)'}</div>
                                <div className="text-xs text-slate-500 grid grid-cols-2 gap-1">
                                  <div><span className="font-medium text-slate-400">ID:</span> {member.student_id || '-'}</div>
                                  <div><span className="font-medium text-slate-400">Email:</span> {member.email || '-'}</div>
                                  <div><span className="font-medium text-slate-400">Phone:</span> {member.phone || '-'}</div>
                                  <div><span className="font-medium text-slate-400">Uni:</span> {member.university || '-'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedApp.custom_responses && Object.keys(selectedApp.custom_responses).length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Additional Info</h4>
                    <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                      {Object.entries(selectedApp.custom_responses).map(([key, value]) => {
                        if (/^[a-z0-9]{8,12}$/.test(key)) return null; // Skip raw IDs if any leak
                        const displayVal = Array.isArray(value) ? value.join(', ') : String(value);
                        if (!displayVal) return null;
                        return (
                          <div key={key} className="p-4 flex flex-col gap-1">
                            <span className="text-xs font-bold text-slate-400 uppercase">{key}</span>
                            <span className="text-sm font-medium text-slate-800">{displayVal}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {selectedApp.transaction_id && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Payment Info</h4>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                      <span className="text-sm text-slate-500">Transaction ID</span>
                      <span className="text-sm font-mono font-bold text-slate-800">{selectedApp.transaction_id}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Remove Priority Event"
        message="Are you sure you want to remove this event from the priority list? The applications will still remain in the database."
        confirmText="Remove"
        onConfirm={handleRemoveEvent}
        onCancel={() => {
          setIsConfirmOpen(false);
          setEventToRemove(null);
        }}
        isDestructive={true}
        requireText="delete"
      />
    </div>
  )
}
