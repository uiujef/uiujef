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
}

export function ApplicationsManager() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false })
      if (error) throw error
      if (data) setApplications(data as Application[])
    } catch (err: any) {
      toast.error('Database Error (Fetch Applications): ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleStatusChange = async (appId: string, newStatus: string) => {
    // Optimistic UI update
    setApplications(apps => apps.map(app => app.application_id === appId ? { ...app, status: newStatus } : app))
    
    try {
      const { error } = await supabase.from('applications').update({ status: newStatus }).eq('application_id', appId)
      if (error) throw error
      toast.success(`Updated ${appId} to ${newStatus}`)
    } catch (err: any) {
      toast.error('Database Error (Update Status): ' + err.message)
      fetchApplications()
    }
  }

  const filteredApps = applications.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.application_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email.toLowerCase().includes(searchQuery.toLowerCase())
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
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Tracking ID</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Applicant</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Type</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredApps.map((app) => (
                  <tr key={app.application_id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-navy">{app.application_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy">{app.name}</div>
                      <div className="text-muted-foreground text-xs">{app.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        app.type === 'Member' ? "bg-blue-500/10 text-blue-700" : "bg-purple-500/10 text-purple-700"
                      )}>
                        {app.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        app.status === 'Approved' ? "bg-green-500/10 text-green-700" :
                        app.status === 'Rejected' ? "bg-red-500/10 text-red-700" :
                        "bg-[#F26522]/10 text-[#F26522]"
                      )}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select 
                        value={app.status} 
                        onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                        className="text-xs font-semibold bg-white border border-border rounded-lg px-2 py-1.5 outline-none focus:border-[#F26522] cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approve</option>
                        <option value="Rejected">Reject</option>
                      </select>
                    </td>
                  </tr>
                ))}
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
