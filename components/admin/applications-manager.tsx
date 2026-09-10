'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, Users, Search, Trash2, CheckCircle, XCircle, Undo2, Eye, Printer, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { exportToCsv } from '@/lib/export-csv'

type Application = {
  application_id: string
  name: string
  email: string
  type: string
  status: string
  created_at?: string
  team_members?: any[]
  custom_responses?: any
  student_id?: string
  transaction_id?: string
  team_name?: string
  event_id?: string
  event_title?: string
}

const isMemberApp = (type?: string) => type === 'Member' || type === 'Membership'

export function ApplicationsManager() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEventFilter, setSelectedEventFilter] = useState('All Events')
  const [activeTab, setActiveTab] = useState<'Member' | 'Event'>('Member')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [appToDelete, setAppToDelete] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)

  const loadApplications = async (tab: 'Member' | 'Event') => {
    setIsLoading(true)
    setApplications([])
    try {
      let query = supabase.from('applications').select('*').order('created_at', { ascending: false })
      
      query = query.neq('status', 'archived')

      if (tab === 'Member') {
        query = query.in('type', ['Member', 'Membership'])
      } else {
        query = query.not('type', 'in', '("Member","Membership")')
      }

      const { data, error } = await query
      if (error) throw error
      
      let enrichedApps: Application[] = []
      
      if (data) {
        if (tab === 'Event') {
          // Fetch all events for client-side join to avoid schema cache issues with foreign keys
          const { data: eventList } = await supabase.from('events').select('id, title')
          const eventMap = Object.fromEntries(eventList?.map(e => [e.id, e.title]) || [])
          
          enrichedApps = data.map(app => ({
            ...app,
            event_title: app.event_id ? eventMap[app.event_id] : undefined
          })) as Application[]
        } else {
          enrichedApps = data as Application[]
        }
      }
      
      setApplications(enrichedApps)
    } catch (err: any) {
      const errorMsg = err.message === 'Failed to fetch' 
        ? 'Network error: Supabase could not be reached. Please check your internet or ad-blocker.'
        : err.message
      toast.error('Database Error (Load Applications): ' + errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApplications(activeTab)
  }, [activeTab])

  const handleStatusChange = async (appId: string, newStatus: string) => {
    const app = applications.find(a => a.application_id === appId)
    if (!app) return

    // Optimistic UI update
    setApplications(apps => apps.map(a => a.application_id === appId ? { ...a, status: newStatus } : a))
    
    try {
      if (newStatus === 'Approved' && isMemberApp(app.type)) {
        // Fetch highest member_serial
        const { data: maxSerialData, error: maxSerialError } = await supabase
          .from('members')
          .select('member_serial')
          .order('member_serial', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (maxSerialError && maxSerialError.code !== 'PGRST116') {
          throw maxSerialError
        }

        let newSerial = 1
        if (maxSerialData && typeof maxSerialData.member_serial === 'number') {
          newSerial = maxSerialData.member_serial + 1
        }
        
        const formattedSerial = newSerial.toString().padStart(4, '0')
        
        const memberData = app.team_members?.[0] || {}
        
        const memberPayload = {
          application_id: app.application_id,
          name: app.name || memberData.full_name || '',
          email: app.email || memberData.email || '',
          role: 'General Member',
          member_serial: newSerial,
          formatted_serial: formattedSerial,
          student_id: memberData.student_id || '',
          phone: memberData.phone || '',
          blood_group: (app as any).blood_group || memberData.blood_group || '',
          facebook_url: memberData.facebook_url || '',
          instagram_url: memberData.instagram_url || '',
          linkedin_url: memberData.linkedin_url || '',
          photo_url: (app as any).photo_url || memberData.photo_url || '',
          image_url: (app as any).photo_url || memberData.photo_url || '',
          quote: memberData.bio || memberData.personal_quote || '',
          bio: memberData.bio || '',
          student_address: memberData.address || memberData.student_address || '',
        }

        const { error: insertError } = await supabase.from('members').insert([memberPayload])
        if (insertError) throw insertError
        
        toast.success(`Member registered with serial ${formattedSerial}`)
      }

      if (app.status === 'Approved' && newStatus !== 'Approved' && isMemberApp(app.type)) {
        const { error: deleteError } = await supabase.from('members').delete().eq('email', app.email)
        if (deleteError) {
          console.error("Failed to delete auto-created member:", deleteError)
        } else {
          toast.success(`Removed member profile for ${app.email}`)
        }
      }

      const { error } = await supabase.from('applications').update({ status: newStatus }).eq('application_id', appId)
      if (error) throw error
      toast.success(`Updated application ${appId} to ${newStatus}`)
    } catch (err: any) {
      toast.error('Database Error: ' + err.message)
      loadApplications(activeTab) // Revert UI
    }
  }

  const confirmDelete = (appId: string) => {
    setAppToDelete(appId)
    setIsConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!appToDelete) return

    try {
      const { error } = await supabase.from('applications').update({ status: 'archived' }).eq('application_id', appToDelete)
      if (error) throw error
      toast.success(`Archived application ${appToDelete}`)
      setApplications(apps => apps.filter(a => a.application_id !== appToDelete))
    } catch (err: any) {
      toast.error('Database Error (Delete): ' + err.message)
    } finally {
      setIsConfirmOpen(false)
      setAppToDelete(null)
    }
  }

  const filteredApps = applications.filter(app => {
    const matchesSearch = (app.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (app.application_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      
    const matchesEvent = activeTab === 'Event' && selectedEventFilter !== 'All Events' 
      ? app.type === selectedEventFilter 
      : true;
      
    return matchesSearch && matchesEvent
  })

  const handleExport = async (approvedOnly: boolean) => {
    const toastId = toast.loading('Exporting data...')
    try {
      let query = supabase.from('applications').select('*').order('created_at', { ascending: false })
      
      if (activeTab === 'Member') {
        query = query.in('type', ['Member', 'Membership'])
      } else {
        query = query.not('type', 'in', '("Member","Membership")')
      }

      if (approvedOnly) {
        query = query.eq('status', 'Approved')
      }

      const { data, error } = await query
      if (error) throw error

      const dataToExport = data as Application[]

      const columns = [
        { header: 'App ID', key: (r: Application) => r.application_id },
        { header: 'Type', key: (r: Application) => r.type },
        { header: 'Status', key: (r: Application) => r.status },
        { header: 'Name', key: (r: Application) => {
            if (isMemberApp(r.type) || !r.team_members || !r.team_members.length) return r.name || ''
            return r.team_members[0].name || r.name || ''
          }
        },
        { header: 'Email', key: (r: Application) => {
            if (isMemberApp(r.type) || !r.team_members || !r.team_members.length) return r.email || ''
            return r.team_members[0].email || r.email || ''
          }
        },
        { header: 'Phone', key: (r: Application) => {
            if (isMemberApp(r.type) || !r.team_members || !r.team_members.length) return (r as any).phone || ''
            return r.team_members[0].phone || ''
          }
        },
        { header: 'University', key: (r: Application) => {
            if (isMemberApp(r.type) || !r.team_members || !r.team_members.length) return (r as any).university || ''
            return r.team_members[0].university || ''
          }
        },
        { header: 'Student ID', key: (r: Application) => {
            if (isMemberApp(r.type) || !r.team_members || !r.team_members.length) return (r as any).student_id || ''
            return r.team_members[0].student_id || ''
          }
        },
        { header: 'Address', key: (r: Application) => {
            if (isMemberApp(r.type) || !r.team_members || !r.team_members.length) return (r as any).address || ''
            return r.team_members[0].address || ''
          }
        },
        { header: 'TrxID', key: (r: Application) => r.transaction_id || '' },
      ]

      exportToCsv(`UIUJEF_${activeTab}_Applications_${approvedOnly ? 'Approved' : 'All'}`, dataToExport, columns)
      toast.success('Export complete', { id: toastId })
    } catch (err: any) {
      toast.error('Export Failed: ' + err.message, { id: toastId })
    }
  }

  const eventTypes = Array.from(new Set(applications.filter(a => !isMemberApp(a.type)).map(a => a.type)))

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Applications</h2>
          <p className="text-sm text-slate-500 mt-1">Review registrations and manage incoming members.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search applications..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none text-sm w-full bg-slate-50 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => handleExport(false)} className="px-4 py-2.5 text-sm font-semibold rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap">
              Export All
            </button>
            <button onClick={() => handleExport(true)} className="px-4 py-2.5 text-sm font-semibold rounded-2xl bg-[#F26522] text-white hover:bg-[#F26522]/90 shadow-sm shadow-[#F26522]/20 transition-all whitespace-nowrap">
              Export Approved
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-px">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('Member')}
            className={cn(
              "px-5 py-3 text-sm font-semibold transition-all border-b-2",
              activeTab === 'Member' ? "border-[#F26522] text-[#F26522]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            Member Registrations
          </button>
          <button
            onClick={() => {
              setActiveTab('Event')
              setSelectedEventFilter('All Events')
            }}
            className={cn(
              "px-5 py-3 text-sm font-semibold transition-all border-b-2",
              activeTab === 'Event' ? "border-[#F26522] text-[#F26522]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            Event Applications
          </button>
        </div>

        {/* Event Filter Dropdown */}
        {activeTab === 'Event' && eventTypes.length > 0 && (
          <div className="pb-2 sm:pb-0 px-2 sm:px-0">
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] cursor-pointer shadow-sm hover:border-slate-300 transition-all"
            >
              <option value="All Events">All Events</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type.replace('Event: ', '')}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Mobile Export Buttons */}
      <div className="flex sm:hidden items-center gap-2 w-full">
        <button onClick={() => handleExport(false)} className="flex-1 px-4 py-2 text-sm font-semibold rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
          Export All
        </button>
        <button onClick={() => handleExport(true)} className="flex-1 px-4 py-2 text-sm font-semibold rounded-2xl bg-[#F26522] text-white hover:bg-[#F26522]/90 shadow-sm transition-all">
          Export Approved
        </button>
      </div>

      {isLoading ? (
        <div className="py-32 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-[#F26522] mb-4" />
          <p className="text-sm font-medium text-slate-500">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="mx-auto size-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <Users className="size-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Applications Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">There are currently no applications matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wide">Tracking ID & Date</th>
                  {activeTab === 'Event' && <th className="px-5 py-4 font-semibold text-xs tracking-wide">Event Name</th>}
                  {activeTab === 'Event' && <th className="px-5 py-4 font-semibold text-xs tracking-wide">Team Name</th>}
                  {activeTab === 'Event' && <th className="px-5 py-4 font-semibold text-xs tracking-wide">Members</th>}
                  
                  {activeTab === 'Member' && <th className="px-5 py-4 font-semibold text-xs tracking-wide">Name & Contact</th>}
                  {activeTab === 'Member' && <th className="px-5 py-4 font-semibold text-xs tracking-wide">Role / Bio</th>}
                  
                  {activeTab === 'Event' && <th className="px-5 py-4 font-semibold text-xs tracking-wide">Contact Person</th>}
                  
                  <th className="px-5 py-4 font-semibold text-xs tracking-wide">University</th>
                  {activeTab === 'Event' && <th className="px-5 py-4 font-semibold text-xs tracking-wide">TrxID</th>}
                  <th className="px-5 py-4 font-semibold text-xs tracking-wide">Status</th>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredApps.map((app, index) => {
                  const memberCount = app.team_members ? app.team_members.length : 1
                  const leadMember = app.team_members && app.team_members.length > 0 ? app.team_members[0] : null
                  const teamName = app.team_name || '-'
                  const university = leadMember?.university || '-'
                  const contactPhone = leadMember?.phone || '-'

                  return (
                    <tr key={`${app.application_id}-${index}`} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-medium text-slate-700">{app.application_id}</div>
                        {app.created_at && (
                          <div className="text-[11px] text-slate-400 mt-1">
                            {new Date(app.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        )}
                        {app.transaction_id && activeTab === 'Member' && (
                          <div className="text-[11px] text-slate-400 mt-1 font-mono">
                            TrxID: {app.transaction_id}
                          </div>
                        )}
                      </td>
                      
                      {activeTab === 'Event' && (
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide bg-indigo-50 text-indigo-600 border border-indigo-100 max-w-[200px] truncate" title={app.event_title || app.type.replace('Event: ', '')}>
                            {app.event_title || app.type.replace('Event: ', '')}
                          </span>
                        </td>
                      )}
                      
                      {activeTab === 'Event' && <td className="px-5 py-4 font-medium text-slate-700 text-sm">{teamName}</td>}
                      
                      {activeTab === 'Event' && (
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full text-xs min-w-[28px]">
                            {memberCount}
                          </span>
                        </td>
                      )}
                      
                      {activeTab === 'Member' && (
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900 text-sm">{app.name}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{app.email}</div>
                          {contactPhone !== '-' && <div className="text-slate-500 text-xs">{contactPhone}</div>}
                        </td>
                      )}

                      {activeTab === 'Member' && (
                        <td className="px-5 py-4 text-xs max-w-[200px] truncate">
                          <div className="font-medium text-[#F26522]">{leadMember?.interested_role || '-'}</div>
                          <div className="text-slate-400 text-xs truncate mt-0.5" title={leadMember?.bio}>{leadMember?.bio || '-'}</div>
                        </td>
                      )}

                      {activeTab === 'Event' && (
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900 text-sm">{app.name}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{app.email}</div>
                          {contactPhone !== '-' && <div className="text-slate-500 text-xs">{contactPhone}</div>}
                        </td>
                      )}
                      
                      <td className="px-5 py-4 text-sm text-slate-600 truncate max-w-[150px]" title={university}>{university}</td>
                      
                      {activeTab === 'Event' && (
                        <td className="px-5 py-4">
                          {app.transaction_id ? (
                            <span className="font-mono text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                              {app.transaction_id}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                      )}
                      
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide border",
                          app.status === 'Approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          app.status === 'Rejected' ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setSelectedApp(app)}
                            className="p-1.5 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors border border-slate-200 hover:border-blue-200" 
                            title="View Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          {app.status === 'Pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusChange(app.application_id, 'Approved')}
                                className="p-1.5 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors border border-slate-200 hover:border-emerald-200" 
                                title="Approve"
                              >
                                <CheckCircle className="size-4" />
                              </button>
                              <button 
                                onClick={() => handleStatusChange(app.application_id, 'Rejected')}
                                className="p-1.5 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-slate-200 hover:border-red-200" 
                                title="Reject"
                              >
                                <XCircle className="size-4" />
                              </button>
                            </>
                          )}
                          {(app.status === 'Rejected' || app.status === 'Approved') && (
                            <button 
                              onClick={() => handleStatusChange(app.application_id, 'Pending')}
                              className="p-1.5 bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors border border-slate-200 hover:border-amber-200" 
                              title="Reset to Pending"
                            >
                              <Undo2 className="size-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => confirmDelete(app.application_id)}
                            className="p-1.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-slate-200 hover:border-red-200 ml-1" 
                            title="Delete Permanently"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {filteredApps.length === 0 && (
              <div className="p-12 text-center text-slate-500 text-sm">
                No applications match your search query.
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Archive Application"
        message="Are you sure you want to archive this application? It will be safely hidden from this view but kept in the database."
        requireText="archive"
        onConfirm={handleDelete}
        onCancel={() => {
          setIsConfirmOpen(false)
          setAppToDelete(null)
        }}
      />

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #printable-modal, #printable-modal * { visibility: visible; color: black !important; }
              #printable-modal { position: absolute; left: 0; top: 0; width: 100%; min-height: 100%; border: none; box-shadow: none; background: white; margin: 0; padding: 20px; }
              .no-print { display: none !important; }
              .print-break-inside-avoid { break-inside: avoid; }
            }
          `}</style>
          <div className="absolute inset-0 bg-navy-deep/80 backdrop-blur-sm no-print" onClick={() => setSelectedApp(null)} />
          <div id="printable-modal" className="relative bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md p-6 border-b border-slate-200 flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Application Details</h3>
                <p className="text-sm font-mono text-slate-500 mt-1">{selectedApp.application_id}</p>
                {selectedApp.created_at && (
                  <p className="text-sm text-slate-500 mt-1">
                    <span className="font-semibold text-slate-800">Applied on:</span> {new Date(selectedApp.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                )}
                {selectedApp.transaction_id && (
                  <p className="text-sm font-mono text-slate-500 mt-1">
                    <span className="font-semibold text-slate-800 font-sans">TrxID:</span> {selectedApp.transaction_id}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 no-print">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white/40 text-slate-800 font-bold rounded-2xl hover:bg-slate-50 transition-colors">
                  <Printer className="size-4" />
                  Download PDF
                </button>
                <button onClick={() => setSelectedApp(null)} className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {!isMemberApp(selectedApp.type) ? (
                // EVENT APPLICATION LAYOUT
                <div className="space-y-8 print-break-inside-avoid">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h5 className="text-sm font-bold uppercase text-[#F26522] mb-4 border-b border-slate-200 pb-2">Primary Details</h5>
                      <dl className="space-y-3 text-sm">
                        <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Event</dt><dd className="font-medium text-slate-800 break-all">{selectedApp.event_title || selectedApp.type.replace('Event: ', '')}</dd></div>
                        <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Team Name</dt><dd className="font-medium text-slate-800">{selectedApp.team_name || '-'}</dd></div>
                        <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Primary Email</dt><dd className="font-medium text-slate-800 break-all">{selectedApp.email || '-'}</dd></div>
                        <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Transaction ID</dt><dd className="font-medium text-slate-800 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">{selectedApp.transaction_id || '-'}</dd></div>
                      </dl>
                    </div>

                    <div>
                      <h5 className="text-sm font-bold uppercase text-[#F26522] mb-4 border-b border-slate-200 pb-2">Status</h5>
                      <dl className="space-y-3 text-sm">
                        <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Application Status</dt><dd className="font-medium text-slate-800">{selectedApp.status || '-'}</dd></div>
                        <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Application Time</dt><dd className="font-medium text-slate-800">{selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '-'}</dd></div>
                      </dl>
                    </div>
                  </div>

                  {selectedApp.custom_responses && Object.keys(selectedApp.custom_responses).length > 0 && (
                    <div className="mt-8">
                      <h5 className="text-sm font-bold uppercase text-[#F26522] mb-4 border-b border-slate-200 pb-2">Custom Responses</h5>
                      <dl className="grid grid-cols-1 gap-6 text-sm">
                        {Object.entries(selectedApp.custom_responses).map(([key, value]) => (
                          <div key={key} className="flex flex-col bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <dt className="text-slate-500 text-xs uppercase font-bold mb-2 break-words">{key}</dt>
                            <dd className="text-slate-800 font-medium whitespace-pre-wrap">
                              {Array.isArray(value) ? value.join(', ') : (value as string) || '-'}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  <div className="mt-8">
                    <h5 className="text-sm font-bold uppercase text-[#F26522] mb-4 border-b border-slate-200 pb-2">Team Members</h5>
                    {selectedApp.team_members && selectedApp.team_members.length > 0 ? (
                      <div className="space-y-6">
                        {selectedApp.team_members.map((member: any, index: number) => (
                          <div key={index} className="bg-white/30 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="size-6 rounded-full bg-[#F26522]/10 text-[#F26522] flex items-center justify-center font-bold text-xs">
                                {index + 1}
                              </div>
                              <h6 className="font-bold text-slate-800">{member.full_name || member.name} {index === 0 ? '(Leader)' : ''}</h6>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm ml-9">
                              <div className="flex flex-col"><dt className="text-slate-500 text-[10px] uppercase font-bold">Email</dt><dd className="font-medium text-slate-800">{member.email || '-'}</dd></div>
                              <div className="flex flex-col"><dt className="text-slate-500 text-[10px] uppercase font-bold">Phone</dt><dd className="font-medium text-slate-800">{member.phone || '-'}</dd></div>
                              <div className="flex flex-col"><dt className="text-slate-500 text-[10px] uppercase font-bold">University / Dept</dt><dd className="font-medium text-slate-800">{member.university || member.department || '-'}</dd></div>
                              <div className="flex flex-col"><dt className="text-slate-500 text-[10px] uppercase font-bold">Student ID</dt><dd className="font-medium text-slate-800">{member.student_id || '-'}</dd></div>
                              <div className="flex flex-col sm:col-span-2"><dt className="text-slate-500 text-[10px] uppercase font-bold">Address</dt><dd className="font-medium text-slate-800">{member.address || member.student_address || '-'}</dd></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">No member details provided.</p>
                    )}
                  </div>
                </div>
              ) : (
                // MEMBER APPLICATION LAYOUT
                selectedApp.team_members && selectedApp.team_members.map((member: any, index: number) => (
                  <div key={index} className="space-y-6 pb-8 border-b border-slate-200 last:border-0 print-break-inside-avoid">
                    <div className="flex items-start gap-4 mb-8">
                      <div className="size-10 rounded-full bg-[#F26522]/10 text-[#F26522] flex items-center justify-center font-bold text-lg shrink-0 mt-2">
                        {index + 1}
                      </div>
                      <div className="flex-1 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="text-xl font-bold text-slate-800">{member.full_name || member.name}</h4>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{selectedApp.type}</span>
                        </div>
                      </div>
                    </div>
  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Identity & Contact */}
                      <div>
                        <h5 className="text-sm font-bold uppercase text-[#F26522] mb-4 border-b border-slate-200 pb-2">Identity & Contact</h5>
                        
                        {member.photo_url && (
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-white/30 p-4 rounded-xl border border-slate-200 mb-6">
                            <img 
                              src={member.photo_url} 
                              alt={`${member.full_name || member.name}'s profile photo`} 
                              className="w-24 h-24 object-cover rounded-2xl shadow-md border-2 border-white" 
                            />
                            <div className="flex flex-col justify-center sm:h-24">
                              <h6 className="font-bold text-slate-800 text-sm mb-2 text-center sm:text-left">Applicant Photo</h6>
                              <a
                                href={member.photo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={`Applicant_${member.full_name || member.name}_Photo`}
                                className="text-xs bg-[#F26522] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#F26522]/90 transition-all flex items-center justify-center gap-2 shadow-sm no-print"
                              >
                                <Printer className="size-4" />
                                Download
                              </a>
                            </div>
                          </div>
                        )}
                        <dl className="space-y-3 text-sm">
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Email</dt><dd className="font-medium text-slate-800 break-all">{member.email || '-'}</dd></div>
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Phone</dt><dd className="font-medium text-slate-800">{member.phone || '-'}</dd></div>
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Student ID</dt><dd className="font-medium text-slate-800">{member.student_id || '-'}</dd></div>
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">University / Department</dt><dd className="font-medium text-slate-800">{member.university || member.department || '-'}</dd></div>
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Blood Group</dt><dd className="font-medium text-slate-800">{member.blood_group || '-'}</dd></div>
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Date of Birth</dt><dd className="font-medium text-slate-800">{member.date_of_birth || '-'}</dd></div>
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Address</dt><dd className="font-medium text-slate-800 break-words">{member.address || member.student_address || '-'}</dd></div>
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Parents</dt><dd className="font-medium text-slate-800">Father: {member.father_name || '-'} <br/> Mother: {member.mother_name || '-'}</dd></div>
                        </dl>
                      </div>
  
                      {/* Socials & Roles */}
                      <div>
                        <h5 className="text-sm font-bold uppercase text-[#F26522] mb-4 border-b border-slate-200 pb-2">Socials & Roles</h5>
                        <dl className="space-y-3 text-sm">
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Interested Role</dt><dd className="font-semibold text-slate-800">{member.interested_roles || member.interested_role || '-'}</dd></div>
                          {member.other_role && <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Other Role</dt><dd className="font-medium text-slate-800">{member.other_role}</dd></div>}
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Payment Method</dt><dd className="font-medium text-slate-800">{member.payment_method || (selectedApp.transaction_id ? 'Paid' : '-')}</dd></div>
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Transaction ID</dt><dd className="font-medium text-slate-800 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">{selectedApp.transaction_id || '-'}</dd></div>
                          <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Application Time</dt><dd className="font-medium text-slate-800">{selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '-'}</dd></div>
                          
                          <div className="pt-3 flex flex-col gap-2">
                            <dt className="text-slate-500 text-xs uppercase font-bold">Social Links</dt>
                            <dd className="space-y-1">
                              {member.facebook_url && <a href={member.facebook_url} target="_blank" rel="noreferrer" className="block text-blue-600 hover:underline break-all">FB: {member.facebook_url}</a>}
                              {member.instagram_url && <a href={member.instagram_url} target="_blank" rel="noreferrer" className="block text-pink-600 hover:underline break-all">IG: {member.instagram_url}</a>}
                              {member.linkedin_url && <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="block text-blue-800 hover:underline break-all">IN: {member.linkedin_url}</a>}
                              {(!member.facebook_url && !member.instagram_url && !member.linkedin_url) && <span className="text-slate-500">No links provided</span>}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
  
                    {/* Story & Bio (Full Width) */}
                    <div className="mt-8">
                      <h5 className="text-sm font-bold uppercase text-[#F26522] mb-4 border-b border-slate-200 pb-2">Biography & Experience</h5>
                      <dl className="space-y-6 text-sm">
                        <div className="flex flex-col bg-white/30 p-4 rounded-2xl"><dt className="text-slate-800 text-xs uppercase font-bold mb-2">Short Bio</dt><dd className="text-slate-800 whitespace-pre-wrap">{member.bio || '-'}</dd></div>
                        <div className="flex flex-col bg-white/30 p-4 rounded-2xl"><dt className="text-slate-800 text-xs uppercase font-bold mb-2">Why join JEF?</dt><dd className="text-slate-800 whitespace-pre-wrap">{member.why_join || '-'}</dd></div>
                        <div className="flex flex-col bg-white/30 p-4 rounded-2xl"><dt className="text-slate-800 text-xs uppercase font-bold mb-2">Expectations from JEF</dt><dd className="text-slate-800 whitespace-pre-wrap">{member.expect_from_jef || '-'}</dd></div>
                        <div className="flex flex-col bg-white/30 p-4 rounded-2xl"><dt className="text-slate-800 text-xs uppercase font-bold mb-2">Extracurricular Activities</dt><dd className="text-slate-800 whitespace-pre-wrap">{member.extracurricular || '-'}</dd></div>
                        <div className="flex flex-col bg-white/30 p-4 rounded-2xl"><dt className="text-slate-800 text-xs uppercase font-bold mb-2">What do you know about JEF?</dt><dd className="text-slate-800 whitespace-pre-wrap">{member.know_about_jef || '-'}</dd></div>
                        <div className="flex flex-col"><dt className="text-slate-500 text-xs uppercase font-bold">Heard about us from</dt><dd className="font-medium text-slate-800">{member.heard_about || '-'}</dd></div>
                      </dl>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
