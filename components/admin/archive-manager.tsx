'use client'

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, Trash2, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/confirm-modal'

export function ArchiveManager() {
  const [activeTab, setActiveTab] = useState<'members' | 'events' | 'news' | 'applications'>('members')
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: string } | null>(null)

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
    </div>
  )
}
