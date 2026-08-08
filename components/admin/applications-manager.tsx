'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, Users, Search } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Application = {
  application_id: string
  name: string
  email: string
  type: string
  status: string
  created_at?: string
  team_members?: any[]
}

export function ApplicationsManager() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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
      if (newStatus === 'Approved' && app.type === 'Member') {
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
        
        const memberPayload = {
          name: app.name,
          email: app.email,
          role: 'General Member',
          member_serial: newSerial,
          formatted_serial: formattedSerial,
        }

        const { error: insertError } = await supabase.from('members').insert([memberPayload])
        if (insertError) throw insertError
        
        toast.success(`Member registered with serial ${formattedSerial}`)
      }

      const { error } = await supabase.from('applications').update({ status: newStatus }).eq('application_id', appId)
      if (error) throw error
      toast.success(`Updated application ${appId} to ${newStatus}`)
    } catch (err: any) {
      toast.error('Database Error: ' + err.message)
      loadApplications() // Revert UI
    }
  }

  const filteredApps = applications.filter(app => 
    (app.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (app.application_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        </div>
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
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Type</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Team Name</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Members</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">University</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Contact Person</th>
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
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                          app.type === 'Member' ? "bg-blue-500/10 text-blue-700 border-blue-500/20" : "bg-purple-500/10 text-purple-700 border-purple-500/20"
                        )}>
                          {app.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-navy text-xs">{teamName}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="inline-flex items-center justify-center bg-secondary text-muted-foreground font-bold px-2 py-0.5 rounded-full min-w-[24px]">
                          {memberCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[150px]" title={university}>{university}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-navy text-xs">{app.name}</div>
                        <div className="text-muted-foreground text-[10px]">{app.email}</div>
                        {contactPhone !== '-' && <div className="text-muted-foreground text-[10px]">{contactPhone}</div>}
                      </td>
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
                        <select 
                          value={app.status} 
                          onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                          className="text-xs font-semibold bg-white border border-border rounded-lg px-2 py-1.5 outline-none focus:border-[#F26522] cursor-pointer shadow-sm"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approve</option>
                          <option value="Rejected">Reject</option>
                        </select>
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
    </div>
  )
}
