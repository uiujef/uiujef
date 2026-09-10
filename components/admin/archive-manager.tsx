'use client'

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, Trash2, ShieldAlert, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/confirm-modal'

export function ArchiveManager() {
  const [activeTab, setActiveTab] = useState<'members' | 'events' | 'news' | 'applications'>('members')
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: string } | null>(null)
  
  const [itemToView, setItemToView] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const loadArchivedItems = async (tab: string) => {
    setIsLoading(true)
    setItems([])
    try {
      let table = tab
      let orderBy = 'created_at'
      
      if (tab === 'applications') {
        orderBy = 'created_at'
      } else if (tab === 'news') {
        orderBy = 'published_at'
      } else if (tab === 'members') {
        orderBy = 'name'
      } else if (tab === 'events') {
        orderBy = 'date'
      }

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('status', 'archived')
        .order(orderBy, { ascending: false })

      if (error) throw error
      if (data) setItems(data)
    } catch (err: any) {
      toast.error(`Database Error (Load ${tab}): ` + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadArchivedItems(activeTab)
  }, [activeTab])

  const confirmDelete = (id: string, type: string) => {
    setItemToDelete({ id, type })
    setIsConfirmOpen(true)
  }

  const handlePermanentDelete = async () => {
    if (!itemToDelete) return
    const { id, type } = itemToDelete
    const idCol = type === 'applications' ? 'application_id' : 'id'

    try {
      const { error } = await supabase.from(type).delete().eq(idCol, id)
      if (error) throw error
      toast.success('Permanently deleted.')
      setItems(items.filter(item => (item.application_id || item.id) !== id))
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message)
    } finally {
      setIsConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  const handleRestore = async (id: string, type: string) => {
    const idCol = type === 'applications' ? 'application_id' : 'id'
    const newStatus = type === 'applications' ? 'Pending' : null

    try {
      const { error } = await supabase.from(type).update({ status: newStatus }).eq(idCol, id)
      if (error) throw error
      toast.success('Item restored successfully.')
      setItems(items.filter(item => (item.application_id || item.id) !== id))
    } catch (err: any) {
      toast.error('Restore failed: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Archive</h2>
          <p className="text-sm text-slate-500 mt-1">Manage soft-deleted items. You can restore them or permanently delete them.</p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 pb-px overflow-x-auto scrollbar-hide">
        {['members', 'events', 'news', 'applications'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 capitalize whitespace-nowrap ${
              activeTab === tab ? "border-[#F26522] text-[#F26522]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-32 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-[#F26522] mb-4" />
          <p className="text-sm text-slate-500">Loading archive...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Trash2 className="size-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Archive Empty</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">No archived {activeTab} found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wide">ID / Title</th>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((item) => {
                  const id = item.application_id || item.id
                  const title = item.name || item.title || item.email || id
                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{title}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{id}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setItemToView(item)
                              setIsViewModalOpen(true)
                            }}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={() => handleRestore(id, activeTab)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Restore"
                          >
                            <RefreshCw className="size-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(id, activeTab)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Permanently Delete"
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
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Permanently Delete"
        message="Are you absolutely sure you want to permanently delete this item? This action CANNOT be undone and data will be lost forever."
        onConfirm={handlePermanentDelete}
        onCancel={() => {
          setIsConfirmOpen(false)
          setItemToDelete(null)
        }}
      />

      {isViewModalOpen && itemToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-800 capitalize">{activeTab.slice(0, -1)} Details</h3>
              <div className="text-xs font-mono text-slate-400">{itemToView.id || itemToView.application_id}</div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600">
              {activeTab === 'events' && (
                <>
                  <div><strong className="text-slate-800">Title:</strong> {itemToView.title}</div>
                  <div><strong className="text-slate-800">Category:</strong> {itemToView.category}</div>
                  <div><strong className="text-slate-800">Date:</strong> {itemToView.date} {itemToView.time && `at ${itemToView.time}`}</div>
                  <div><strong className="text-slate-800">Event Level:</strong> {itemToView.event_level}</div>
                  <div><strong className="text-slate-800 flex items-start gap-1">Description:</strong> <p className="mt-1 whitespace-pre-wrap text-slate-500">{itemToView.description}</p></div>
                </>
              )}
              {activeTab === 'applications' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><strong className="text-slate-800">Name:</strong> {itemToView.name}</div>
                    <div><strong className="text-slate-800">Email:</strong> {itemToView.email}</div>
                    <div><strong className="text-slate-800">Student ID:</strong> {itemToView.student_id}</div>
                    <div><strong className="text-slate-800">Phone:</strong> {itemToView.phone}</div>
                  </div>
                  {(itemToView.custom_responses && Object.keys(itemToView.custom_responses).length > 0) && (
                    <div className="mt-6 border-t pt-4">
                      <strong className="text-slate-800 mb-2 block">Custom Responses:</strong>
                      <div className="space-y-3">
                        {Object.entries(itemToView.custom_responses).map(([key, val]: any) => (
                          <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="text-xs font-bold text-slate-700 mb-1">{key}</div>
                            <div className="text-sm text-slate-600">{Array.isArray(val) ? val.join(', ') : String(val)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(itemToView.team_members && itemToView.team_members.length > 0) && (
                    <div className="mt-6 border-t pt-4">
                      <strong className="text-slate-800 mb-2 block">Team Members:</strong>
                      <div className="space-y-2">
                        {itemToView.team_members.map((tm: any, i: number) => (
                          <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                            <span className="font-semibold text-slate-800">{tm.name}</span> ({tm.student_id}) - {tm.email}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {activeTab === 'members' && (
                <div className="space-y-2">
                  <div><strong className="text-slate-800">Name:</strong> {itemToView.name}</div>
                  <div><strong className="text-slate-800">Email:</strong> {itemToView.email}</div>
                  <div><strong className="text-slate-800">Student ID:</strong> {itemToView.student_id}</div>
                  <div><strong className="text-slate-800">University:</strong> {itemToView.university}</div>
                  <div><strong className="text-slate-800">Phone:</strong> {itemToView.phone}</div>
                </div>
              )}
              {activeTab === 'news' && (
                <>
                  <div><strong className="text-slate-800">Title:</strong> {itemToView.title}</div>
                  <div><strong className="text-slate-800">Published:</strong> {new Date(itemToView.published_at).toLocaleDateString()}</div>
                  <div><strong className="text-slate-800">Excerpt:</strong> <p className="mt-1">{itemToView.excerpt}</p></div>
                </>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
