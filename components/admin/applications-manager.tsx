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
  transaction_id?: string
}

const isMemberApp = (type?: string) => type === 'Member' || type === 'Membership'

export function ApplicationsManager() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'Member' | 'Event'>('Member')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [appToDelete, setAppToDelete] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)

  const loadApplications = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false })
      if (error) throw error
      if (data) setApplications(data as Application[])
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
    loadApplications()
  }, [])

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
          blood_group: memberData.blood_group || '',
          facebook_url: memberData.facebook_url || '',
          instagram_url: memberData.instagram_url || '',
          linkedin_url: memberData.linkedin_url || '',
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
      loadApplications() // Revert UI
    }
  }

  const confirmDelete = (appId: string) => {
    setAppToDelete(appId)
    setIsConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!appToDelete) return

    try {
      const { error } = await supabase.from('applications').delete().eq('application_id', appToDelete)
      if (error) throw error
      toast.success(`Deleted application ${appToDelete}`)
      setApplications(apps => apps.filter(a => a.application_id !== appToDelete))
    } catch (err: any) {
      toast.error('Database Error (Delete): ' + err.message)
    } finally {
      setIsConfirmOpen(false)
      setAppToDelete(null)
    }
  }

  const tabFilteredApps = applications.filter(app => {
    if (activeTab === 'Member') return isMemberApp(app.type)
    return app.type.startsWith('Event')
  })

  const filteredApps = tabFilteredApps.filter(app => 
    (app.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (app.application_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleExport = (approvedOnly: boolean) => {
    let dataToExport = applications.filter(a => isMemberApp(a.type))
    if (approvedOnly) {
      dataToExport = dataToExport.filter(a => a.status === 'Approved')
    }

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

    exportToCsv(`UIUJEF_Applications_${approvedOnly ? 'Approved' : 'All'}`, dataToExport, columns)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">Applications & Members</h2>
          <p className="text-muted-foreground mt-1">Review registrations and manage members.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-border focus:border-[#F26522] outline-none text-sm w-full sm:w-64"
            />
          </div>
          {activeTab === 'Member' && (
            <>
              <button onClick={() => handleExport(false)} className="px-4 py-2 text-sm font-semibold rounded-xl bg-secondary text-navy hover:bg-secondary/80 border border-border transition-colors">
                Export All (CSV)
              </button>
              <button onClick={() => handleExport(true)} className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#F26522]/10 text-[#F26522] hover:bg-[#F26522]/20 border border-[#F26522]/30 transition-colors">
                Export Approved Only
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('Member')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-full transition-colors",
            activeTab === 'Member' ? "bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20" : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-navy"
          )}
        >
          Member Applications
        </button>
        <button
          onClick={() => setActiveTab('Event')}
          className={cn(
            "px-6 py-2.5 text-sm font-bold rounded-full transition-colors",
            activeTab === 'Event' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-navy"
          )}
        >
          Event Applications
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-[#F26522] mb-4" />
          <p className="text-lg font-semibold text-navy">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <div className="mx-auto size-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">No Applications Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">There are currently no member applications or event registrations in the system.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/80 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Tracking ID</th>
                  {activeTab === 'Event' && <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Event Name</th>}
                  {activeTab === 'Event' && <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Team Name</th>}
                  {activeTab === 'Event' && <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Members</th>}
                  
                  {activeTab === 'Member' && <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Name & Contact</th>}
                  {activeTab === 'Member' && <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Role / Bio</th>}
                  
                  {activeTab === 'Event' && <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Contact Person</th>}
                  
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">University</th>
                  {activeTab === 'Event' && <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">TrxID</th>}
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredApps.map((app) => {
                  const memberCount = app.team_members ? app.team_members.length : 1
                  const leadMember = app.team_members && app.team_members.length > 0 ? app.team_members[0] : null
                  const teamName = leadMember && app.team_members && app.team_members.length > 1 ? (app as any).team_name || 'Team' : '-'
                  const university = leadMember?.university || '-'
                  const contactPhone = leadMember?.phone || '-'

                  return (
                    <tr key={app.application_id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-navy">{app.application_id}</td>
                      
                      {activeTab === 'Event' && (
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-purple-500/10 text-purple-700 border-purple-500/20">
                            {app.type.replace('Event: ', '')}
                          </span>
                        </td>
                      )}
                      
                      {activeTab === 'Event' && <td className="px-4 py-3 font-semibold text-navy text-xs">{teamName}</td>}
                      
                      {activeTab === 'Event' && (
                        <td className="px-4 py-3 text-xs">
                          <span className="inline-flex items-center justify-center bg-secondary text-muted-foreground font-bold px-2 py-0.5 rounded-full min-w-[24px]">
                            {memberCount}
                          </span>
                        </td>
                      )}
                      
                      {activeTab === 'Member' && (
                        <td className="px-4 py-3">
                          <div className="font-bold text-navy text-xs">{app.name}</div>
                          <div className="text-muted-foreground text-[10px]">{app.email}</div>
                          <div className="text-muted-foreground text-[10px]">{contactPhone !== '-' ? contactPhone : ''}</div>
                        </td>
                      )}

                      {activeTab === 'Member' && (
                        <td className="px-4 py-3 text-xs max-w-[200px] truncate">
                          <div className="font-semibold text-[#F26522]">{leadMember?.interested_role || '-'}</div>
                          <div className="text-muted-foreground text-[10px] truncate" title={leadMember?.bio}>{leadMember?.bio || '-'}</div>
                        </td>
                      )}

                      {activeTab === 'Event' && (
                        <td className="px-4 py-3">
                          <div className="font-bold text-navy text-xs">{app.name}</div>
                          <div className="text-muted-foreground text-[10px]">{app.email}</div>
                          {contactPhone !== '-' && <div className="text-muted-foreground text-[10px]">{contactPhone}</div>}
                        </td>
                      )}
                      
                      <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[150px]" title={university}>{university}</td>
                      
                      {activeTab === 'Event' && (
                        <td className="px-4 py-3">
                          {app.transaction_id ? (
                            <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
                              {app.transaction_id}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                      )}
                      
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                          app.status === 'Approved' ? "bg-green-500/10 text-green-700 border-green-500/20" :
                          app.status === 'Rejected' ? "bg-red-500/10 text-red-700 border-red-500/20" :
                          "bg-[#F26522]/10 text-[#F26522] border-[#F26522]/20"
                        )}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedApp(app)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg shadow-sm transition-colors" 
                            title="View Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          {app.status === 'Pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusChange(app.application_id, 'Approved')}
                                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-lg shadow-sm transition-colors" 
                                title="Approve"
                              >
                                <CheckCircle className="size-4" />
                              </button>
                              <button 
                                onClick={() => handleStatusChange(app.application_id, 'Rejected')}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg shadow-sm transition-colors" 
                                title="Reject"
                              >
                                <XCircle className="size-4" />
                              </button>
                            </>
                          )}
                          {(app.status === 'Rejected' || app.status === 'Approved') && (
                            <button 
                              onClick={() => handleStatusChange(app.application_id, 'Pending')}
                              className="p-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700 rounded-lg shadow-sm transition-colors" 
                              title="Reset to Pending"
                            >
                              <Undo2 className="size-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => confirmDelete(app.application_id)}
                            className="p-1.5 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-lg shadow-sm transition-colors ml-2" 
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
              <div className="p-8 text-center text-muted-foreground">
                No applications match your search query.
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Application"
        message="Are you sure you want to delete this application permanently? This action cannot be undone."
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
          <div id="printable-modal" className="relative bg-white border border-border rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md p-6 border-b border-border flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl font-bold text-navy">Application Details</h3>
                <p className="text-sm font-mono text-muted-foreground mt-1">{selectedApp.application_id}</p>
              </div>
              <div className="flex items-center gap-3 no-print">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-secondary text-navy font-bold rounded-xl hover:bg-secondary/80 transition-colors">
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
              {selectedApp.team_members && selectedApp.team_members.map((member: any, index: number) => (
                <div key={index} className="space-y-6 pb-8 border-b border-border last:border-0 print-break-inside-avoid">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-full bg-[#F26522]/10 text-[#F26522] flex items-center justify-center font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-navy">{member.full_name || member.name}</h4>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{selectedApp.type}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Identity & Contact */}
                    <div>
                      <h5 className="text-sm font-bold uppercase text-[#F26522] mb-4 border-b border-border pb-2">Identity & Contact</h5>
                      <dl className="space-y-3 text-sm">
                        <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">Email</dt><dd className="font-medium text-navy break-all">{member.email || '-'}</dd></div>
                        <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">Phone</dt><dd className="font-medium text-navy">{member.phone || '-'}</dd></div>
                        <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">Student ID</dt><dd className="font-medium text-navy">{member.student_id || '-'}</dd></div>
                        <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">University / Department</dt><dd className="font-medium text-navy">{member.university || member.department || '-'}</dd></div>
                        <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">Blood Group</dt><dd className="font-medium text-navy">{member.blood_group || '-'}</dd></div>
                        <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">Date of Birth</dt><dd className="font-medium text-navy">{member.date_of_birth || '-'}</dd></div>
                        <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">Address</dt><dd className="font-medium text-navy break-words">{member.address || member.student_address || '-'}</dd></div>
                        <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">Parents</dt><dd className="font-medium text-navy">Father: {member.father_name || '-'} <br/> Mother: {member.mother_name || '-'}</dd></div>
                      </dl>
                    </div>

                    {/* Socials & Roles */}
                    <div>
                      <h5 className="text-sm font-bold uppercase text-[#F26522] mb-4 border-b border-border pb-2">Socials & Roles</h5>
                      <dl className="space-y-3 text-sm">
                        <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">Interested Role</dt><dd className="font-semibold text-navy">{member.interested_roles || member.interested_role || '-'}</dd></div>
                        {member.other_role && <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">Other Role</dt><dd className="font-medium text-navy">{member.other_role}</dd></div>}
                        <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">Payment Method</dt><dd className="font-medium text-navy">{selectedApp.transaction_id ? `${member.payment_method || 'Paid'} (TrxID: ${selectedApp.transaction_id})` : '-'}</dd></div>
                        
                        <div className="pt-3 flex flex-col gap-2">
                          <dt className="text-muted-foreground text-xs uppercase font-bold">Social Links</dt>
                          <dd className="space-y-1">
                            {member.facebook_url && <a href={member.facebook_url} target="_blank" rel="noreferrer" className="block text-blue-600 hover:underline break-all">FB: {member.facebook_url}</a>}
                            {member.instagram_url && <a href={member.instagram_url} target="_blank" rel="noreferrer" className="block text-pink-600 hover:underline break-all">IG: {member.instagram_url}</a>}
                            {member.linkedin_url && <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="block text-blue-800 hover:underline break-all">IN: {member.linkedin_url}</a>}
                            {(!member.facebook_url && !member.instagram_url && !member.linkedin_url) && <span className="text-muted-foreground">No links provided</span>}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Story & Bio (Full Width) */}
                  <div className="mt-8">
                    <h5 className="text-sm font-bold uppercase text-[#F26522] mb-4 border-b border-border pb-2">Biography & Experience</h5>
                    <dl className="space-y-6 text-sm">
                      <div className="flex flex-col bg-secondary/30 p-4 rounded-xl"><dt className="text-navy text-xs uppercase font-bold mb-2">Short Bio</dt><dd className="text-navy whitespace-pre-wrap">{member.bio || '-'}</dd></div>
                      <div className="flex flex-col bg-secondary/30 p-4 rounded-xl"><dt className="text-navy text-xs uppercase font-bold mb-2">Why join JEF?</dt><dd className="text-navy whitespace-pre-wrap">{member.why_join || '-'}</dd></div>
                      <div className="flex flex-col bg-secondary/30 p-4 rounded-xl"><dt className="text-navy text-xs uppercase font-bold mb-2">Expectations from JEF</dt><dd className="text-navy whitespace-pre-wrap">{member.expect_from_jef || '-'}</dd></div>
                      <div className="flex flex-col bg-secondary/30 p-4 rounded-xl"><dt className="text-navy text-xs uppercase font-bold mb-2">Extracurricular Activities</dt><dd className="text-navy whitespace-pre-wrap">{member.extracurricular || '-'}</dd></div>
                      <div className="flex flex-col bg-secondary/30 p-4 rounded-xl"><dt className="text-navy text-xs uppercase font-bold mb-2">What do you know about JEF?</dt><dd className="text-navy whitespace-pre-wrap">{member.know_about_jef || '-'}</dd></div>
                      <div className="flex flex-col"><dt className="text-muted-foreground text-xs uppercase font-bold">Heard about us from</dt><dd className="font-medium text-navy">{member.heard_about || '-'}</dd></div>
                    </dl>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
